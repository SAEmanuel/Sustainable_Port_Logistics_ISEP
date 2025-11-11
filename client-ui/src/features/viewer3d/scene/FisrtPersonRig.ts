import * as THREE from "three";
import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls.js";

export type FPRigOpts = {
    speed?: number;          // m/s
    sprint?: number;         // multiplicador Shift
    eyeHeight?: number;      // altura dos olhos (m)
    groundY?: number;        // y do chão
    stickToGround?: boolean; // manter y = groundY
    autoPointerLock?: boolean; // entrar em FP ao clicar
    keyToggleCode?: string;    // tecla para alternar (ex.: "KeyF")
    domElement?: HTMLElement;
};

export class FirstPersonRig {
    camera: THREE.Camera;
    controls: PointerLockControls;
    dom: HTMLElement;

    speed = 6;
    sprint = 1.8;
    eyeHeight = 1.75;
    groundY = 0;
    stickToGround = true;

    anchor: THREE.Object3D | null = null;
    dir = new THREE.Vector3();
    keys = { w:false, a:false, s:false, d:false, shift:false };

    private _enabled = false;
    private _autoPointerLock = false;
    private _keyToggle = "KeyF";

    constructor(camera: THREE.Camera, domElement: HTMLElement, opts: FPRigOpts = {}) {
        this.camera = camera;
        this.dom = opts.domElement ?? domElement;

        this.controls = new PointerLockControls(this.camera, this.dom);

        this.speed = opts.speed ?? this.speed;
        this.sprint = opts.sprint ?? this.sprint;
        this.eyeHeight = opts.eyeHeight ?? this.eyeHeight;
        this.groundY = opts.groundY ?? this.groundY;
        this.stickToGround = opts.stickToGround ?? this.stickToGround;
        this._autoPointerLock = opts.autoPointerLock ?? false;
        this._keyToggle = opts.keyToggleCode ?? "KeyF";

        window.addEventListener("keydown", this.onKeyDown);
        window.addEventListener("keyup", this.onKeyUp);

        // toggle por tecla (KeyF por omissão)
        window.addEventListener("keydown", (e) => {
            if (e.code === this._keyToggle) {
                e.preventDefault();
                this.togglePointerLock();
            }
        });

        if (this._autoPointerLock) {
            this.dom.addEventListener("click", () => this.lock());
        }

        this.controls.addEventListener("lock", () => (this._enabled = true));
        this.controls.addEventListener("unlock", () => (this._enabled = false));
    }

    dispose() {
        window.removeEventListener("keydown", this.onKeyDown);
        window.removeEventListener("keyup", this.onKeyUp);
    }

    /** Liga a câmara ao “corpo” (anchor). */
    attachTo(anchor: THREE.Object3D | null) {
        this.anchor = anchor;
        this.updateEyePosition();
    }

    setEyeHeight(h: number) {
        this.eyeHeight = h;
        this.updateEyePosition();
    }

    private updateEyePosition() {
        if (!this.anchor) return;
        const p = new THREE.Vector3();
        this.anchor.getWorldPosition(p);
        // controls.object é o “player” (sem getObject() nas versões recentes)
        const obj = this.controls.object as THREE.Object3D;
        obj.position.set(
            p.x,
            (this.stickToGround ? this.groundY : p.y) + this.eyeHeight,
            p.z
        );
    }

    lock()  { this.controls.lock(); }
    unlock(){ this.controls.unlock(); }
    togglePointerLock() { this._enabled ? this.unlock() : this.lock(); }

    private onKeyDown = (e: KeyboardEvent) => {
        switch (e.code) {
            case "KeyW": this.keys.w = true; break;
            case "KeyA": this.keys.a = true; break;
            case "KeyS": this.keys.s = true; break;
            case "KeyD": this.keys.d = true; break;
            case "ShiftLeft":
            case "ShiftRight": this.keys.shift = true; break;
        }
    };
    private onKeyUp = (e: KeyboardEvent) => {
        switch (e.code) {
            case "KeyW": this.keys.w = false; break;
            case "KeyA": this.keys.a = false; break;
            case "KeyS": this.keys.s = false; break;
            case "KeyD": this.keys.d = false; break;
            case "ShiftLeft":
            case "ShiftRight": this.keys.shift = false; break;
        }
    };

    /** Movimento por frame */
    update(dt: number) {
        const locked = this.controls.isLocked;

        // seguir anchor APENAS quando em FP
        if (locked && this.anchor) {
            const p = new THREE.Vector3();
            this.anchor.getWorldPosition(p);
            const obj = this.controls.object as THREE.Object3D;
            obj.position.x = p.x;
            obj.position.z = p.z;
            obj.position.y = (this.stickToGround ? this.groundY : p.y) + this.eyeHeight;
        }

        if (!locked) return;

        const base = this.speed * (this.keys.shift ? this.sprint : 1);
        const move = base * dt;

        this.controls.getDirection(this.dir);
        this.dir.y = 0; this.dir.normalize();
        const right = new THREE.Vector3().crossVectors(this.dir, new THREE.Vector3(0,1,0)).normalize();

        const obj = this.controls.object as THREE.Object3D;
        if (this.keys.w) obj.position.addScaledVector(this.dir,  move);
        if (this.keys.s) obj.position.addScaledVector(this.dir, -move);
        if (this.keys.d) obj.position.addScaledVector(right,  move);
        if (this.keys.a) obj.position.addScaledVector(right, -move);

        // arrastar o corpo junto
        if (this.anchor) {
            this.anchor.position.set(
                obj.position.x,
                (this.stickToGround ? this.groundY : this.anchor.position.y),
                obj.position.z
            );
        }
    }
}
