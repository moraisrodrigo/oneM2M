import { CSE_ID } from "../constants";
import { ResourceType, ShortName } from "./index";

export class ApplicationEntity {
    [ShortName.Type] = ResourceType.ApplicationEntity;
    [ShortName.ResourceName]!: string;
    [ShortName.ResourceID]!: string;
    [ShortName.ParentId]!: string;
    [ShortName.CreationTime]!: string;
    [ShortName.LastModifiedTime]!: string;

    constructor(resourceName: string, resourceId: string) {
        this[ShortName.ResourceName] = resourceName;
        this[ShortName.ResourceID] = resourceId;
        this[ShortName.ParentId] = CSE_ID();
        this[ShortName.CreationTime] = new Date().toISOString();
    }
}