import { ShortName, ResourceType } from "./index";

export class ContentInstance {
    [ShortName.Type] = ResourceType.ContentInstance;
    [ShortName.ContentFormat]: string = "text/plain";
    [ShortName.ResourceName]!: string;
    [ShortName.ResourceID]!: string;
    [ShortName.CreationTime]!: string;
    [ShortName.Content]!: any;

    constructor(resourceName: string, resourceId: string, content: any) {
        this[ShortName.ResourceName] = resourceName;
        this[ShortName.ResourceID] = resourceId;
        this[ShortName.CreationTime] = new Date().toISOString();
        this[ShortName.Content] = content;
    }
}