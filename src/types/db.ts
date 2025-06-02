import { ApplicationEntity, Container, ContentInstance } from "../types";

export interface DBType {
    AEs: Array<ApplicationEntity>;
    containers: Array<Container>;
    contentInstances: Array<ContentInstance>;
}
