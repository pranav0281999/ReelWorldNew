import * as THREE from "three";
import { PlayerControls } from "./lib/playerControls.js";
import { ResourceTracker } from "./lib/threejsResourceTracker";
import {
  AudioListener,
  AxesHelper,
  Color,
  GridHelper,
  Group,
  Light,
  Mesh,
  Object3D,
  PerspectiveCamera,
  Quaternion,
  Scene,
  Vector3,
  WebGLRenderer,
} from "three";
import {
  CSS2DObject,
  CSS2DRenderer,
} from "three/examples/jsm/renderers/CSS2DRenderer";

class World {
  public scene: Scene | null;
  public camera: PerspectiveCamera | null;
  public renderer: WebGLRenderer | null;
  public controls: any;
  public labelRenderer: CSS2DRenderer | null;
  public resourseTracker: ResourceTracker | null;
  public frameTimer: any;
  public user: Group;
  public userHeadMesh: Mesh;
  public position: Vector3 | null;
  public rotation: Quaternion | null;
  public sendUserPosition: () => void;
  public clients: {
    [key: string]: any;
  };
  public audioListener: AudioListener | null;
  public sharedScreen: {
    [key: string]: any;
  };
  public userBody: Object3D | null;
  public userLabel: any;
  public updateControls: boolean;
  public username: string;
  public ended: boolean = false;

  constructor(sendUserPositionCallback: () => void, username: string) {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera();
    this.renderer = new THREE.WebGLRenderer();
    this.controls = new PlayerControls(this.camera, new THREE.Object3D());
    this.labelRenderer = new CSS2DRenderer();
    this.resourseTracker = new ResourceTracker();
    this.frameTimer = null;
    this.user = new THREE.Group();
    this.userHeadMesh = new THREE.Mesh();
    this.position = new THREE.Vector3();
    this.rotation = new THREE.Quaternion();
    this.sendUserPosition = sendUserPositionCallback;
    this.clients = {};
    this.audioListener = new THREE.AudioListener();
    this.sharedScreen = {};
    this.userBody = new THREE.Object3D();
    this.userLabel = new THREE.Object3D();
    this.updateControls = true;
    this.username = username;
  }

  init = () => {
    const canvas = document.getElementById("c") as HTMLElement;
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      logarithmicDepthBuffer: true,
    });

    this.scene = new THREE.Scene();
    this.scene.background = new Color(0x000000);

    //ambient light to reduce computations and keep everything visible
    const ambientLight = this.resourseTracker?.track(
      new THREE.AmbientLight(0xffffff, 1)
    ) as Light;
    this.scene.add(ambientLight);

    //setting this so that center is known
    const axesHelper = this.resourseTracker?.track(
      new THREE.AxesHelper(5)
    ) as AxesHelper;
    axesHelper.position.y = 1;
    this.scene.add(axesHelper);

    //setting the stage
    let gridHelper = this.resourseTracker?.track(
      new THREE.GridHelper(200, 20)
    ) as GridHelper;
    this.scene.add(gridHelper);

    //camera to follow user around
    const fov = 90;
    const aspect = window.innerWidth / window.innerHeight;
    const far = 283;
    const near = 1;
    this.camera = new THREE.PerspectiveCamera(fov, aspect, far, near);
    this.camera.position.y = 10;
    this.camera.position.z = 15;
    this.camera.lookAt(0, 0, 0);

    //setting up user
    const userLowerBodyGeo = new THREE.BoxGeometry(5, 5, 5);
    const userLowerBodyMat = new THREE.MeshBasicMaterial();
    let userLowerBodyMesh = new THREE.Mesh(userLowerBodyGeo, userLowerBodyMat);
    userLowerBodyMesh.position.y = 2.5;

    const userUpperBodyGeo = new THREE.BoxGeometry(5, 5, 5);
    const userUpperBodyMat = new THREE.MeshNormalMaterial();
    let userUpperBodyMesh = new THREE.Mesh(userUpperBodyGeo, userUpperBodyMat);
    userUpperBodyMesh.position.y = 7.5;

    this.userHeadMesh = userUpperBodyMesh;

    let userBody = new THREE.Object3D();
    userBody.add(userUpperBodyMesh);
    userBody.add(userLowerBodyMesh);
    userBody.add(this.audioListener as AudioListener);

    let userLabelDiv = document.createElement("div");
    userLabelDiv.className = "label";
    userLabelDiv.textContent = this.username;
    userLabelDiv.style.marginTop = "-2em";
    userLabelDiv.style.color = "white";
    userLabelDiv.style.fontSize = "2em";
    const userLabel = new CSS2DObject(userLabelDiv) as unknown as Object3D;
    userLabel.position.set(0, 11, 0);
    userBody.add(userLabel);

    this.userBody = userBody;
    this.userLabel = userLabel;

    this.user = this.resourseTracker?.track(new THREE.Group()) as Group;
    this.user.add(userBody);
    this.user.add(this.camera);

    this.scene.add(this.user);

    //setting up movement controls
    //I have not used the main camera here as I didn't like the camera movement provided by the library
    this.controls = new PlayerControls(this.camera, this.user);
    this.controls.moveSpeed = 2;
    this.controls.turnSpeed = 0.1;
    this.controls.maxDistanceFromCenter = 100;

    //to show labels
    if (!!this.labelRenderer) {
      this.labelRenderer.setSize(window.innerWidth, window.innerHeight);
      this.labelRenderer.domElement.style.position = "absolute";
      this.labelRenderer.domElement.style.top = "0px";
      document.getElementById("div-canvas")?.appendChild(this.labelRenderer.domElement);
    }

    requestAnimationFrame(this.render);
  };

  addClient = (clientId: string, username: string) => {
    //setting up client
    const clientLowerBodyGeo = new THREE.BoxGeometry(5, 5, 5);
    const clientLowerBodyMat = new THREE.MeshBasicMaterial();
    let clientLowerBodyMesh = new THREE.Mesh(
      clientLowerBodyGeo,
      clientLowerBodyMat
    );
    clientLowerBodyMesh.position.y = 2.5;

    const clientUpperBodyGeo = new THREE.BoxGeometry(5, 5, 5);
    const clientUpperBodyMat = new THREE.MeshNormalMaterial();
    let clientUpperBodyMesh = new THREE.Mesh(
      clientUpperBodyGeo,
      clientUpperBodyMat
    );
    clientUpperBodyMesh.position.y = 7.5;

    let clientBody = new THREE.Object3D();
    clientBody.add(clientUpperBodyMesh);
    clientBody.add(clientLowerBodyMesh);

    let clientLabelDiv = document.createElement("div");
    clientLabelDiv.className = "label";
    clientLabelDiv.textContent = username;
    clientLabelDiv.style.marginTop = "-2em";
    clientLabelDiv.style.color = "white";
    clientLabelDiv.style.fontSize = "2em";
    const clientLabel = new CSS2DObject(clientLabelDiv) as unknown as Object3D;
    clientLabel.position.set(0, 11, 0);
    clientBody.add(clientLabel);

    let client = this.resourseTracker?.track(new THREE.Group()) as Group;
    client.add(clientBody);

    let userAudio = new THREE.PositionalAudio(
      this.audioListener as AudioListener
    );
    userAudio.setRefDistance(10);
    userAudio.setMaxDistance(200);
    client.add(userAudio);

    this.clients[clientId] = {};

    this.clients[clientId].mesh = client;
    this.clients[clientId].audio = userAudio;
    this.clients[clientId].video = null;
    this.clients[clientId].screen = null;
    this.clients[clientId].upperBody = clientUpperBodyMesh;
    this.clients[clientId].body = clientBody;
    this.clients[clientId].label = clientLabel;
    this.clients[clientId].peerConnection = null;
    this.clients[clientId].shareScreenPeerConnection = null;
    this.clients[clientId].videoSender = null;
    this.clients[clientId].audioSender = null;
    this.clients[clientId].shareScreenSender = null;

    this.scene?.add(client);
  };

  removeClient = (clientId: string) => {
    if (this.clients[clientId]) {
      this.removeAudioForClient(clientId);
      this.removeVideoForClient(clientId);

      this.clients[clientId].body.remove(this.clients[clientId].label);

      this.scene?.remove(this.clients[clientId].mesh);
      delete this.clients[clientId];
    }
  };

  updateClient = (clientId: string, position: number[], rotation: number[]) => {
    if (this.clients[clientId]) {
      this.clients[clientId].mesh.position.set(...position);
      this.clients[clientId].mesh.quaternion.set(...rotation);
    }
  };

  addScreenShareForClient = (clientId: string, stream: MediaStream) => {
    let positions;
    positions = Object.keys(this.sharedScreen).map((key) => {
      return this.sharedScreen[key].position;
    });

    let newPosition: number = 0;

    for (let i = 0; i < 4; i++) {
      if (positions.find((position) => position === i) === undefined) {
        newPosition = i;
        break;
      }
    }

    let video = document.createElement("video");
    video.srcObject = stream;
    video.play().then(() => {
      console.log("Remote screen playing");
    });

    const videoTexture = new THREE.VideoTexture(video);

    let planeMesh = this.resourseTracker?.track(
      new THREE.Mesh(
        new THREE.PlaneGeometry(50, 50),
        new THREE.MeshBasicMaterial({ map: videoTexture })
      )
    ) as Mesh;

    video.onloadeddata = function () {
      const aspectRatio = video.videoWidth / video.videoHeight;
      planeMesh.scale.set(1, 1 / aspectRatio, 1);

      planeMesh.position.y = 25 / aspectRatio;

      if (newPosition > 1) {
        if (newPosition % 2) {
          planeMesh.rotation.y = 0;
          planeMesh.position.z = -100;
        } else {
          planeMesh.rotation.y = (90 * Math.PI) / 180;
          planeMesh.position.x = -100;
        }
      } else {
        if (newPosition % 2) {
          planeMesh.rotation.y = (180 * Math.PI) / 180;
          planeMesh.position.z = 100;
        } else {
          planeMesh.rotation.y = (-90 * Math.PI) / 180;
          planeMesh.position.x = 100;
        }
      }
    };

    this.sharedScreen[clientId] = {
      mesh: planeMesh,
      position: newPosition,
      screen: video,
    };

    this.scene?.add(planeMesh);
  };

  removeScreenShareForClient = (clientId: string) => {
    if (this.sharedScreen[clientId]) {
      this.scene?.remove(this.sharedScreen[clientId].mesh);
      this.sharedScreen[clientId].screen.pause();

      delete this.sharedScreen[clientId];
    }
  };

  addVideoForUser = (video: HTMLVideoElement) => {
    const basicMaterial = new THREE.MeshBasicMaterial();

    const videoTexture = new THREE.VideoTexture(video);

    this.userHeadMesh.material = [
      basicMaterial,
      basicMaterial,
      basicMaterial,
      basicMaterial,
      new THREE.MeshBasicMaterial({ map: videoTexture }),
      basicMaterial,
    ];
  };

  addVideoForClient = (clientId: string, stream: MediaStream) => {
    if (this.clients[clientId]) {
      let video = document.createElement("video");
      video.srcObject = stream;
      video.play().then(() => {
        console.log("Remote video playing");
      });

      const basicMaterial = new THREE.MeshBasicMaterial();

      const videoTexture = new THREE.VideoTexture(video);

      this.clients[clientId].upperBody.material = [
        basicMaterial,
        basicMaterial,
        basicMaterial,
        basicMaterial,
        basicMaterial,
        new THREE.MeshBasicMaterial({ map: videoTexture }),
      ];
      this.clients[clientId].video = video;
    }
  };

  addAudioForClient = (clientId: string, stream: MediaStream) => {
    if (this.clients[clientId]) {
      this.clients[clientId].audio.setMediaStreamSource(stream);
      this.clients[clientId].audio.play();
    }
  };

  removeAllClientVideo = () => {
    Object.keys(this.clients).forEach((key) => {
      this.removeVideoForClient(key);
    });
  };

  removeAllClientAudio = () => {
    Object.keys(this.clients).forEach((key) => {
      this.removeAudioForClient(key);
    });
  };

  removeAllClientScreens = (selfSocketId: string) => {
    Object.keys(this.sharedScreen).forEach((key) => {
      if (key !== selfSocketId) {
        this.removeScreenShareForClient(key);
      }
    });
  };

  removeVideoStreamForUser = () => {
    this.userHeadMesh.material = new THREE.MeshNormalMaterial();
  };

  removeVideoForClient = (clientId: string) => {
    if (this.clients[clientId]) {
      this.clients[clientId].upperBody.material =
        new THREE.MeshNormalMaterial();

      if (this.clients[clientId].video) {
        this.clients[clientId].video.pause();
      }

      this.clients[clientId].video = null;
    }
  };

  removeAudioForClient = (clientId: string) => {
    if (this.clients[clientId]) {
      if (this.clients[clientId].audio.isPlaying) {
        this.clients[clientId].audio.stop();
      }
    }
  };

  resizeRendererToDisplaySize = () => {
    const canvas = this.renderer?.domElement as HTMLCanvasElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const needResize = canvas.width !== width || canvas.height !== height;
    if (needResize) {
      this.renderer?.setSize(width, height, false);
      this.renderer?.setSize(width, height, false);
      this.labelRenderer?.setSize(width, height);
    }
    return needResize;
  };

  render = () => {
    if (this.ended) {
      return;
    }
    try {
      let distance = this.position?.distanceTo(this.user.position) as number;

      if (distance > 1) {
        this.position?.copy(this.user.position);
        this.sendUserPosition();
      }

      let rotation =
        (this.user.quaternion.angleTo(this.rotation as Quaternion) * 180) /
        Math.PI;

      if (rotation > 2) {
        this.rotation?.copy(this.user.quaternion);
        this.sendUserPosition();
      }

      if (this.resizeRendererToDisplaySize()) {
        const canvas = this.renderer?.domElement as HTMLCanvasElement;
        (this.camera as PerspectiveCamera).aspect =
          canvas?.clientWidth / canvas?.clientHeight;
        this.camera?.updateProjectionMatrix();
      }

      if (this.updateControls) {
        this.controls.update();
      }

      this.renderer?.render(
        this.scene as Scene,
        this.camera as PerspectiveCamera
      );
      this.labelRenderer?.render(
        this.scene as Scene,
        this.camera as PerspectiveCamera
      );

      this.frameTimer = setTimeout(() => {
        requestAnimationFrame(this.render);
      }, 1000 / 30);
    } catch (e) {
      console.error(e);
    }
  };

  endWorld = () => {
    this.ended = true;
    this.removeVideoStreamForUser();

    Object.keys(this.clients).forEach((key) => {
      this.removeClient(key);
    });

    this.userBody?.remove(this.userLabel as Object3D);
    this.userBody = null;
    this.userLabel = null;

    if (this.frameTimer) {
      clearTimeout(this.frameTimer);
    }

    this.resourseTracker?.dispose();
    this.resourseTracker = null;
    // this.scene.dispose();
    this.scene = null;
    this.renderer?.dispose();
    this.renderer = null;

    this.camera = null;
    this.controls = null;
    this.labelRenderer = null;

    this.position = null;
    this.rotation = null;
    this.sendUserPosition = () => {
      return;
    };
    this.clients = {};
    this.audioListener = null;

    // document.getElementById("c")?.remove();
    // let newCanvas = document.createElement("canvas");
    // newCanvas.id = "c";
    // document.body.appendChild(newCanvas);
  };
}

export { World };
