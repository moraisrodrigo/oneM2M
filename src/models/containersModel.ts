import { Container, ShortName } from "../types/index";
import { getTimestamp } from "../utils/misc";

export class ContainerModel extends Container {
    [ShortName.ParentId]!: string;
    [ShortName.CreationTime]!: string;

    constructor(resourceName: string, resourceId: string, parentApplicationEntityId: string) {
        super(resourceName, resourceId);
        this[ShortName.ParentId] = parentApplicationEntityId;
        this[ShortName.CreationTime] = getTimestamp();
    }
}