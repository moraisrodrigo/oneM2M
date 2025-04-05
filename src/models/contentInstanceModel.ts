import { ContentInstance, ShortName } from "../types";

export class ContentInstanceModel extends ContentInstance implements BaseModelInterface<ContentInstance> {
    [ShortName.ParentId]!: string;

    constructor(resourceName: string, resourceId: string, content: any, parentContainerId: string) {
        super(resourceName, resourceId,content);
        this[ShortName.ParentId] = parentContainerId;
    }

    getDTO(): ContentInstance {
        return {
            [ShortName.Type]: this[ShortName.Type],
            [ShortName.ContentFormat]: this[ShortName.ContentFormat],
            [ShortName.ResourceName]: this[ShortName.ResourceName],
            [ShortName.ResourceID]: this[ShortName.ResourceID],
            [ShortName.CreationTime]: this[ShortName.CreationTime],
            [ShortName.Content]: this[ShortName.Content],
        }
    }
}