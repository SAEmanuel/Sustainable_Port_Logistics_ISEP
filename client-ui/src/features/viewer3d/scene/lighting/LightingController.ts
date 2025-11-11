import * as THREE from "three";
import GUI from "lil-gui";

export type LightingOptions = {
    enableGUI?: boolean;
    startTime?: number;      // 0..24 horas
    exposure?: number;       // 0.3..2
    ambientIntensity?: number;
    hemiIntensity?: number;
    dirIntensity?: number;
    guiMount?: HTMLElement | string; 
    guiPlacement?: "top-right" | "top-left" | "bottom-right" | "bottom-left" | "static";
    castsShadows?: boolean;
    shadowSize?: 512 | 1024 | 2048;
};

export class LightingController {
    scene: THREE.Scene;
    renderer: THREE.WebGLRenderer;
    gui?: GUI;

    ambient!: THREE.AmbientLight;
    hemi!: THREE.HemisphereLight;
    sun!: THREE.DirectionalLight;

    params = {
        timeOfDay: 13.0,  // horas (0..24)
        exposure: 1.0,
        ambient: 0.35,
        hemi: 0.35,
        sun: 1.1,
        azimuthDeg: 130,  // rotação do “sol” no plano (0..360)
        enableShadows: true,
        preset: "Custom" as "Custom" | "Dawn" | "Noon" | "Sunset" | "Night",
    };

    private shadowCamSize = 400;

    constructor(scene: THREE.Scene, renderer: THREE.WebGLRenderer, opts?: LightingOptions) {
        this.scene = scene;
        this.renderer = renderer;

        // Renderer “look”
        (THREE as any).ColorManagement && (THREE as any).ColorManagement.legacyMode === false;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = opts?.exposure ?? 1.0;
        renderer.shadowMap.enabled = opts?.castsShadows ?? true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // Luzes base
        this.ambient = new THREE.AmbientLight(0xffffff, opts?.ambientIntensity ?? 0.35);
        this.scene.add(this.ambient);

        this.hemi = new THREE.HemisphereLight(0xbfd6ff, 0x404040, opts?.hemiIntensity ?? 0.35);
        this.scene.add(this.hemi);

        this.sun = new THREE.DirectionalLight(0xffffff, opts?.dirIntensity ?? 1.1);
        this.sun.position.set(200, 300, 200);
        this.sun.castShadow = opts?.castsShadows ?? true;

        // Sombras do sol
        this.sun.shadow.mapSize.set(opts?.shadowSize ?? 1024, opts?.shadowSize ?? 1024);
        this.sun.shadow.bias = -0.0006;
        this.sun.shadow.normalBias = 0.02;
        const cam = this.sun.shadow.camera as THREE.OrthographicCamera;
        cam.near = 1;
        cam.far = 1200;
        this.updateShadowCameraBounds(this.shadowCamSize);
        this.scene.add(this.sun);
        this.scene.add(this.sun.target);

        // Inicializa estado
        this.params.timeOfDay = opts?.startTime ?? 13;
        this.params.exposure = opts?.exposure ?? 1.0;
        this.applyTimeOfDay();

        if (opts?.enableGUI) {
            // resolve contêiner
            const mount =
                typeof opts.guiMount === "string"
                    ? document.querySelector(opts.guiMount)
                    : opts?.guiMount ?? document.body;

            this.gui = new GUI({ title: "Lighting", container: mount ?? undefined });

            // posicionamento
            const el = this.gui.domElement as HTMLElement;
            if (opts?.guiPlacement !== "static") {
                (mount as HTMLElement)?.style.setProperty("position", "relative");
                el.style.position = "absolute";
                el.style.zIndex = "10";
                const pos = opts?.guiPlacement ?? "top-right";
                el.style.top = pos.includes("top") ? "10px" : "auto";
                el.style.bottom = pos.includes("bottom") ? "10px" : "auto";
                el.style.left = pos.includes("left") ? "10px" : "auto";
                el.style.right = pos.includes("right") ? "10px" : "auto";
            }
            this.buildGUI(); // move a criação dos folders para usar this.gui já montado
        }
    }

    /** Atualiza bounds do “frustum” ortográfico das sombras para apanhar o palco */
    updateShadowCameraBounds(size: number) {
        this.shadowCamSize = size;
        const cam = this.sun.shadow.camera as THREE.OrthographicCamera;
        cam.left = -size; cam.right = size; cam.top = size; cam.bottom = -size;
        cam.updateProjectionMatrix();
    }

    /** Converte hora do dia em ângulo solar e cores “quentes/frias” */
    applyTimeOfDay() {
        const t = this.params.timeOfDay; // 0..24
        // Elevação: 0h/noite → -5°, 12h → 60°, 18h → 10°, 24h → -5°
        const elevDeg = Math.max(-5, -5 + Math.sin((t / 24) * Math.PI * 2) * 65);
        const elev = THREE.MathUtils.degToRad(elevDeg);
        const azim = THREE.MathUtils.degToRad(this.params.azimuthDeg);

        // Posição do “sol” numa esfera
        const r = 600;
        const y = Math.max(40, r * Math.sin(elev));
        const flat = r * Math.cos(elev);
        const x = flat * Math.cos(azim);
        const z = flat * Math.sin(azim);
        this.sun.position.set(x, y, z);
        this.sun.target.position.set(0, 0, 0);
        this.sun.target.updateMatrixWorld();

        // Cores de acordo com hora (tom mais quente no nascer/pôr)
        const warm = new THREE.Color("#ffd7a3");
        const cold = new THREE.Color("#ffffff");
        const night = new THREE.Color("#a7c1ff");

        // fator “dia”: 0 = noite, 1 = dia
        const day = THREE.MathUtils.clamp(Math.sin((t - 6) * (Math.PI / 12)), 0, 1);
        const warmBlend = Math.pow(Math.sin((Math.PI * (t % 12)) / 12), 2); // picos ao amanhecer/entardecer

        const sunCol = cold.clone().lerp(warm, warmBlend * 0.6).lerp(night, 1 - day);
        const skyCol = new THREE.Color("#dbe9ff").lerp(night, 1 - day);
        const groundCol = new THREE.Color("#3f4145");

        this.sun.color.copy(sunCol);
        this.hemi.color.copy(skyCol);
        this.hemi.groundColor.copy(groundCol);

        // Intensidades com base no “day factor”
        const k = 0.15 + day * 0.85;
        this.ambient.intensity = this.params.ambient * k * 1.0;
        this.hemi.intensity = this.params.hemi * k * 1.2;
        this.sun.intensity = this.params.sun * (0.2 + day * 1.0);

        // Exposure global
        this.renderer.toneMappingExposure = this.params.exposure;
    }

    applyPreset(p: "Dawn" | "Noon" | "Sunset" | "Night") {
        this.params.preset = p;
        if (p === "Dawn") { this.params.timeOfDay = 6.0; this.params.exposure = 0.9; }
        if (p === "Noon") { this.params.timeOfDay = 13.0; this.params.exposure = 1.0; }
        if (p === "Sunset") { this.params.timeOfDay = 18.5; this.params.exposure = 0.95; }
        if (p === "Night") { this.params.timeOfDay = 23.0; this.params.exposure = 0.6; }
        this.applyTimeOfDay();
    }

    buildGUI() {
        this.gui = new GUI({ title: "Lighting" });
        const f1 = this.gui.addFolder("Sun");
        f1.add(this.params, "timeOfDay", 0, 24, 0.1).name("Time").onChange(() => this.applyTimeOfDay());
        f1.add(this.params, "azimuthDeg", 0, 360, 1).name("Azimuth").onChange(() => this.applyTimeOfDay());
        f1.add(this.params, "sun", 0, 2, 0.01).name("Sun Intensity").onChange(() => this.applyTimeOfDay());

        const f2 = this.gui.addFolder("Fill");
        f2.add(this.params, "ambient", 0, 2, 0.01).name("Ambient").onChange(() => this.applyTimeOfDay());
        f2.add(this.params, "hemi", 0, 2, 0.01).name("Hemisphere").onChange(() => this.applyTimeOfDay());

        const f3 = this.gui.addFolder("Camera/Render");
        f3.add(this.params, "exposure", 0.3, 2, 0.01).name("Exposure").onChange(() => this.applyTimeOfDay());
        f3.add(this.params, "enableShadows").name("Shadows").onChange((v: boolean) => {
            this.sun.castShadow = v;
            this.renderer.shadowMap.enabled = v;
        });
        f3.add({ size: this.shadowCamSize }, "size", 100, 800, 50)
            .name("Shadow Bounds").onChange((s: number) => this.updateShadowCameraBounds(s));

        const presets = this.gui.addFolder("Presets");
        presets.add(this.params, "preset", ["Custom", "Dawn", "Noon", "Sunset", "Night"])
            .name("Preset").onChange((p: string) => p !== "Custom" && this.applyPreset(p as any));
    }

    dispose() {
        this.gui?.destroy();
        this.scene.remove(this.ambient, this.hemi, this.sun, this.sun.target);
    }
}
