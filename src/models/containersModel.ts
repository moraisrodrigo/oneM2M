import { Container, ShortName } from "../types";

export class ContainerModel extends Container implements BaseModelInterface<Container> {
    [ShortName.ParentId]!: string;

    constructor(resourceName: string, resourceId: string, parentApplicationEntityId: string) {
        super(resourceName, resourceId);
        this[ShortName.ParentId] = parentApplicationEntityId;
    }

    getDTO(): Container {
        return {
            [ShortName.Type]: this[ShortName.Type],
            [ShortName.ResourceName]: this[ShortName.ResourceName],
            [ShortName.ResourceID]: this[ShortName.ResourceID],
            [ShortName.CreationTime]: this[ShortName.CreationTime],
        }
    }
}