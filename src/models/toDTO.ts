import { ApplicationEntityModel, ContainerModel, ContentInstanceModel } from "./index.js";
import { ApplicationEntity, Container, ContentInstance, ResourceType, ShortName } from "../types/index.js";

export const toDTO = (data: ApplicationEntityModel | ContainerModel | ContentInstanceModel) => {
    switch (data[ShortName.Type]) {
        case ResourceType.ContentInstance:
            const contentInstance = data as ContentInstanceModel;
            return {
                [ShortName.Type]: ResourceType.ContentInstance,
                [ShortName.ResourceID]: contentInstance[ShortName.ResourceID],
                [ShortName.ResourceName]: contentInstance[ShortName.ResourceName],
                [ShortName.Content]: contentInstance[ShortName.Content],
                [ShortName.CreationTime]: contentInstance[ShortName.CreationTime],
            } as ContentInstance;
        case ResourceType.Container:
            const container = data as ContainerModel;
            return {
                [ShortName.Type]: ResourceType.Container,
                [ShortName.ResourceID]: container[ShortName.ResourceID],
                [ShortName.ResourceName]: container[ShortName.ResourceName],
                [ShortName.CreationTime]: container[ShortName.CreationTime],
            } as Container;
        default:
        case ResourceType.ApplicationEntity:
            const applicationEntity = data as ContainerModel;
            return {
                [ShortName.Type]: ResourceType.ApplicationEntity,
                [ShortName.ResourceID]: applicationEntity[ShortName.ResourceID],
                [ShortName.ResourceName]: applicationEntity[ShortName.ResourceName],
                [ShortName.CreationTime]: applicationEntity[ShortName.CreationTime],
            } as ApplicationEntity;
    }
}