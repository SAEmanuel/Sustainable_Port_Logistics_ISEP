export class Result<T> {
    public isSuccess: boolean;
    public isFailure: boolean;
    public error?: T | string;
    private _value?: T;

    public constructor(isSuccess: boolean, error?: T | string, value?: T) {
        if (isSuccess && error !== undefined) {
            throw new Error(
                "InvalidOperation: A result cannot be successful and contain an error"
            );
        }

        if (!isSuccess && error === undefined) {
            throw new Error(
                "InvalidOperation: A failing result needs to contain an error message"
            );
        }

        this.isSuccess = isSuccess;
        this.isFailure = !isSuccess;
        this.error = error;
        this._value = value;

        Object.freeze(this);
    }

    public getValue(): T {
        if (!this.isSuccess || this._value === undefined) {
            throw new Error(
                "Can't get the value of an error result. Use 'errorValue' instead."
            );
        }

        return this._value;
    }

    public errorValue(): T | string {
        if (this.isSuccess) {
            throw new Error(
                "Can't get the error of a successful result."
            );
        }

        return this.error as T | string;
    }

    public static ok<U>(value?: U): Result<U> {
        return new Result<U>(true, undefined, value);
    }

    public static fail<U>(error: U | string): Result<U> {
        return new Result<U>(false, error);
    }

    public static combine(results: Result<any>[]): Result<any> {
        for (const result of results) {
            if (result.isFailure) return result;
        }
        return Result.ok();
    }
}