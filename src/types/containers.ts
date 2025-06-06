import { ShortName, ResourceType } from "./index";

export class Container {
    [ShortName.Type] = ResourceType.Container;
    [ShortName.ResourceName]!: string;
    [ShortName.ResourceID]!: string;
    [ShortName.CreationTime]!: string;
    [ShortName.LastModifiedTime]!: string;

    constructor(resourceName: string, resourceId: string) {
        this[ShortName.ResourceName] = resourceName;
        this[ShortName.ResourceID] = resourceId;
        this[ShortName.CreationTime] = new Date().toISOString();
    }
}