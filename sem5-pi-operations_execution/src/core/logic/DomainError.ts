import { UseCaseError } from "./UseCaseError";

export class DomainError extends UseCaseError {
    public readonly code: string;

    constructor(code: string, message: string) {
        super(message);
        this.code = code;
    }
}