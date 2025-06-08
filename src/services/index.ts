import { getDB, saveDB } from '../db/index';
import { ShortName } from '../types/index';
import { ApplicationEntity, Container, ContentInstance } from '../types';
import { getTimestamp } from '../utils/misc';

export class Service {
    private db = getDB();

    private save(): void {
        saveDB(this.db);
    }

    createAE(resourceName: string): ApplicationEntity | null {
        const applicationEntityFound = this.db.AEs.find((ae) => ae[ShortName.ResourceName] === resourceName);
        if (applicationEntityFound) return null;

        const newApplicationEntity = new ApplicationEntity
            (resourceName, getTimestamp());
        this.db.AEs.push(newApplicationEntity);

        this.save();

        return newApplicationEntity;
    }

    updateAE(resourceName: string): ApplicationEntity | null {
        const applicationEntityFound = this.db.AEs.find((ae) => ae[ShortName.ResourceName] === resourceName);
        if (!applicationEntityFound) return null;

        applicationEntityFound[ShortName.LastModifiedTime] = getTimestamp();
        this.save();

        return applicationEntityFound;
    }

    deleteAE(resourceName: string): boolean {
        const applicationEntity = this.db.AEs.find((ae) => ae[ShortName.ResourceName] === resourceName);

        if (!applicationEntity) return false;

        const containers = this.db.containers.filter(container => container[ShortName.ParentId] === applicationEntity[ShortName.ResourceID]);

        if (containers.length) {
            containers.forEach(container => {
                const contentInstances = this.db.contentInstances.filter(contentInstance => contentInstance[ShortName.ParentId] === container[ShortName.ResourceID]);

                if (contentInstances.length) {
                    contentInstances.forEach(contentInstance => {
                        const contentInstanceIndex = this.db.contentInstances.findIndex((ci) => ci[ShortName.ResourceID] === contentInstance[ShortName.ResourceID]);
                        if (contentInstanceIndex !== -1) this.db.contentInstances.splice(contentInstanceIndex);
                    });
                }

                const containerIndex = this.db.containers.findIndex((c) => c[ShortName.ResourceID] === container[ShortName.ResourceID]);
                if (containerIndex !== -1) this.db.containers.splice(containerIndex);
            });
        }

        const applicationEntityIndex = this.db.AEs.findIndex((ae) => ae[ShortName.ResourceName] === resourceName);
        if (applicationEntityIndex !== -1) {
            this.db.AEs.splice(applicationEntityIndex);
            this.save();
            return true;
        }

        return false;
    }

    createContainer(
        resourceName: string,
        resourceId: string,
        parentApplicationEntityName: string
    ): Container | null {
        const applicationEntityFound = this.db.AEs.find((applicationEntity) => applicationEntity[ShortName.ResourceName] === parentApplicationEntityName);
        // Check if the application entity exists
        if (!applicationEntityFound) return null;

        const containerFound = this.db.containers.find((container) => container[ShortName.ParentId] === applicationEntityFound[ShortName.ResourceID]);
        // Check if the container already exists for the given parent application entity
        if (containerFound) return null;

        const newContainer = new Container(resourceName, resourceId, applicationEntityFound[ShortName.ResourceID]);
        this.db.containers.push(newContainer);

        this.save();

        return newContainer;
    }

    updateContainer(resourceName: string): Container | null {
        const containerFound = this.db.containers.find((container) => container[ShortName.ResourceName] === resourceName);
        if (!containerFound) return null;

        containerFound[ShortName.LastModifiedTime] = getTimestamp();
        this.save();

        return containerFound;
    }

    deleteContainer(resourceName: string): boolean {
        const container = this.db.containers.find((container) => container[ShortName.ResourceName] === resourceName);

        if (!container) return false;

        const contentInstances = this.db.contentInstances.filter(contentInstance => contentInstance[ShortName.ParentId] === container[ShortName.ResourceID]);

        if (contentInstances.length) {
            contentInstances.forEach(contentInstance => {
                const contentInstanceIndex = this.db.contentInstances.findIndex((ci) => ci[ShortName.ResourceID] === contentInstance[ShortName.ResourceID]);
                if (contentInstanceIndex !== -1) this.db.contentInstances.splice(contentInstanceIndex);
            });
        }

        const containerIndex = this.db.containers.findIndex((container) => container[ShortName.ResourceName] === resourceName);
        if (containerIndex !== -1) {
            this.db.containers.splice(containerIndex);
            this.save();
            return true;
        }

        return false;
    }

    createContentInstance(
        parentContainerName: string,
        parentApplicationEntityName: string,
        content: any
    ): ContentInstance | null {
        const applicationEntityFound = this.db.AEs.find((applicationEntity) => applicationEntity[ShortName.ResourceName] === parentApplicationEntityName);
        // Check if the application entity exists
        if (!applicationEntityFound) return null;

        const containerFound = this.db.containers.find((container) => container[ShortName.ParentId] === applicationEntityFound[ShortName.ResourceID] && container[ShortName.ResourceName] === parentContainerName);
        // Check if the container exists for the given parent application entity
        if (!containerFound) return null;

        const newContentInstance = new ContentInstance(content, containerFound[ShortName.ResourceID]);
        this.db.contentInstances.push(newContentInstance);

        this.save();

        return newContentInstance;
    }

    deleteContentInstance(parentId: string): boolean {
        const contentInstance = this.db.contentInstances.filter((ci) => ci.pi === parentId).sort((a, b) => b.ct.localeCompare(a.ct))[0];
        const contentInstanceIndex = this.db.contentInstances.findIndex((ci) => ci[ShortName.ResourceID] === contentInstance.ri);
        if (contentInstanceIndex !== -1) {
            this.db.contentInstances.splice(contentInstanceIndex);
            this.save();
            return true;
        }

        return false;
    }

    getAEs(): ApplicationEntity[] {
        return this.db.AEs;
    }

    getAE(rn: String): ApplicationEntity | undefined {
        return this.db.AEs.find((ae) => ae.rn === rn);
    }

    getAEByResourceId(ri: String): ApplicationEntity | undefined {
        return this.db.AEs.find((ae) => ae.ri === ri);
    }

    getContainers(): Container[] {
        return this.db.containers;
    }

    getContainer(rn: String): Container | undefined {
        return this.db.containers.find((container) => container.rn === rn);
    }

    getContainersByParentId(pi: String): Container[] {
        return this.db.containers.filter(container => container[ShortName.ParentId] === pi);
    }

    getContainerByResourceId(ri: String): Container | undefined {
        return this.db.containers.find((container) => container[ShortName.ResourceID] === ri);
    }

    getContentInstances(): ContentInstance[] {
        return this.db.contentInstances;
    }

    getContentInstancesByParentId(pi: String): ContentInstance[] {
        return this.db.contentInstances.filter(contentInstance => contentInstance[ShortName.ParentId] === pi);
    }
}