import { ApplicationEntity } from "../types/index";

export class ApplicationEntityModel extends ApplicationEntity {
    constructor(resourceName: string, resourceId: string) {
        super(resourceName, resourceId);
    }
}