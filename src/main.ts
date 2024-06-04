import { filter, fromEvent, map, merge, withLatestFrom } from "rxjs";
import {
	BoxGeometry,
	Mesh,
	MeshBasicMaterial,
	PerspectiveCamera,
	Raycaster,
	Scene,
	Vector2,
	WebGLRenderer,
} from "three";

import "./style.css";

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <canvas id="experience"></canvas>
`;

/**
 * Camera
 */
const camera = new PerspectiveCamera(
	75,
	window.innerWidth / window.innerHeight,
	0.1,
	1000
);
camera.position.z = 5;

/**
 * Renderer
 */
const canvas = document.querySelector<HTMLButtonElement>("canvas#experience")!;
const renderer = new WebGLRenderer({
	canvas,
});
renderer.setSize(window.innerWidth, window.innerHeight);

/**
 * Cube Mesh
 */
const geometry = new BoxGeometry(1, 1, 1);
const material = new MeshBasicMaterial({ color: 0x00ff00 });
const cube = new Mesh(geometry, material);

/**
 * Scene
 */
const scene = new Scene();
scene.add(cube);

/**
 * Raycaster
 */
const raycaster = new Raycaster();
const pointer = new Vector2();

/**
 * Events
 */
renderer.setAnimationLoop(() => {
	cube.rotation.x += 0.01;
	cube.rotation.y += 0.01;

	renderer.render(scene, camera);
});

fromEvent<UIEvent>(window, "resize").subscribe(() => {
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
});

const cubeClicked$ = fromEvent<MouseEvent>(window, "mousedown").pipe(
	filter((e) => e.target === canvas),
	map((e) => {
		pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
		pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;

		raycaster.setFromCamera(pointer, camera);
		const intersects = raycaster.intersectObjects(scene.children);
		const list = [];

		for (let i = 0; i < intersects.length; i++) {
			const currentMats = intersects[i].object;

			if (
				currentMats instanceof Mesh &&
				currentMats.material instanceof MeshBasicMaterial
			)
				list.push(currentMats.material);
		}

		return { type: e.type as "mousedown", list };
	})
);

merge(
	cubeClicked$,
	fromEvent<MouseEvent>(window, "mouseup").pipe(
		withLatestFrom(cubeClicked$),
		map(([e, prev]) => ({
			...prev,
			type: e.type as "mouseup",
		}))
	)
).subscribe((value) => {
	if (value.type === "mousedown")
		value.list.map((mat) => mat.color.set(0xff0000));
	if (value.type === "mouseup")
		value.list.map((mat) => mat.color.set(0x00ff00));
});
