import { ResourceType, ShortName } from "./index.js";

export class ApplicationEntity {
    [ShortName.Type] = ResourceType.ApplicationEntity;
    [ShortName.ResourceName]!: string;
    [ShortName.ResourceID]!: string;
    [ShortName.CreationTime]!: string;

    constructor(resourceName: string, resourceId: string) {
        this[ShortName.ResourceName] = resourceName;
        this[ShortName.ResourceID] = resourceId;
        this[ShortName.CreationTime] = new Date().toISOString();
    }
}