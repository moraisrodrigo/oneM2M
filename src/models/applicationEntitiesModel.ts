import { ApplicationEntity } from "../types/index.js";

export class ApplicationEntityModel extends ApplicationEntity {
    constructor(resourceName: string, resourceId: string) {
        super(resourceName, resourceId);
    }
}