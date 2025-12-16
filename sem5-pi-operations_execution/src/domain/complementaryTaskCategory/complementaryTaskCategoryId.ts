import {UniqueEntityID} from "../../core/domain/UniqueEntityID";
import {Entity} from "../../core/domain/Entity";

export class ComplementaryTaskCategoryId extends Entity<any> {

    get id(): UniqueEntityID {
        return this._id;
    }

    private constructor(id?: UniqueEntityID) {
        super(null, id);
    }

    public static create(id: string | UniqueEntityID): ComplementaryTaskCategoryId {
        return new ComplementaryTaskCategoryId(
            typeof id === "string" ? new UniqueEntityID(id) : id
        );
    }
}