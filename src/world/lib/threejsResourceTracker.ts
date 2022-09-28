import * as THREE from "three";
import { Material, Object3D, Texture } from "three";
import { Geometry } from "three/examples/jsm/deprecated/Geometry";

type Resource =
  | Object3D
  | Material
  | Geometry
  | Texture
  | Object3D[]
  | Texture[];

class ResourceTracker {
  public resources: Set<Resource>;

  public constructor() {
    this.resources = new Set();
  }

  public track(resource: Resource) {
    if (!resource) {
      return resource;
    }

    // handle children and when material is an array of materials or
    // uniform is array of textures
    if (Array.isArray(resource)) {
      resource.forEach((resource) => this.track(resource));
      return resource;
    }

    // @ts-ignore
    if (resource.dispose || resource instanceof THREE.Object3D) {
      this.resources.add(resource);
    }
    if (resource instanceof THREE.Object3D) {
      // @ts-ignore
      this.track(resource.geometry);
      // @ts-ignore
      this.track(resource.material);
      this.track(resource.children);
    } else if (resource instanceof THREE.Material) {
      // We have to check if there are any textures on the material
      for (const value of Object.values(resource)) {
        if (value instanceof THREE.Texture) {
          this.track(value);
        }
      }
    }
    return resource;
  }

  public untrack(resource: Resource) {
    this.resources.delete(resource);
  }

  public dispose() {
    for (const resource of this.resources) {
      if (resource instanceof THREE.Object3D) {
        if (resource.parent) {
          resource.parent.remove(resource);
        }
      }
      // @ts-ignore
      if (resource.dispose) {
        // @ts-ignore
        resource.dispose();
      }
    }
    this.resources.clear();
  }
}

export { ResourceTracker };
