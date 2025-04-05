import { ApplicationEntityModel, ContainerModel, ContentInstanceModel } from "../models";

export interface DBType {
    AEs: Array<ApplicationEntityModel>;
    containers: Array<ContainerModel>;
    contentInstances: Array<ContentInstanceModel>;
}
