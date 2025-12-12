import QualificationsService from "../services/ExternalData/qualificationsService";

async function test() {
    const service = new QualificationsService();

    const data = await service.fetchAll();

    console.log("Qualifications:");
    console.log(data);
}

test().catch(err => {
    console.error("Error fetching qualifications:", err);
});


// PESSOAL PARA TESTAREM SE ESTÁ A DAR IR BUSCAR CENAS RODEM NO TERMINAL:
// NODE_ENV=development ts-node src/dev/testQualifications.ts

//MUDEM SÓ O .ts  PARA O VOSSO