import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

let mongod: MongoMemoryServer | null = null;

export async function connectInMemoryMongo() {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();

    // Opcional mas recomendável em testes (evita builds de índices em background)
    mongoose.set("autoIndex", false);

    await mongoose.connect(uri, {
        autoIndex: false,
    } as any);
}

export async function clearDatabase() {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        await collections[key].deleteMany({});
    }
}

export async function closeDatabase() {
    // Não faças dropDatabase aqui — é a causa mais comum de teardown a bloquear
    try {
        if (mongoose.connection.readyState !== 0) {
            // force = true: fecha sockets mesmo com operações pendentes
            await mongoose.connection.close(true);
        }
    } finally {
        if (mongod) {
            await mongod.stop();
            mongod = null;
        }
    }
}
