import { ShortName, ResourceType } from "./index.js";

export class Container {
    [ShortName.Type] = ResourceType.Container;
    [ShortName.ResourceName]!: string;
    [ShortName.ResourceID]!: string;
    [ShortName.CreationTime]!: string;

    constructor(resourceName: string, resourceId: string) {
        this[ShortName.ResourceName] = resourceName;
        this[ShortName.ResourceID] = resourceId;
        this[ShortName.CreationTime] = new Date().toISOString();
    }
}