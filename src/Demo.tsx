import React, { MutableRefObject, useEffect, useRef } from "react";
import { World } from "./world/World";

function Demo() {
  let world: MutableRefObject<World | null> = useRef(null);

  useEffect(() => {
    if (!world.current) {
      world.current = new World(() => {}, "Hello");
    }
    world.current?.init();

    return () => {
      world.current?.endWorld();
      world.current = null;
    };
  }, []);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
      }}
      id="div-canvas"
    >
      <canvas
        style={{
          width: "100%",
          height: "100%",
        }}
        id="c"
      />
    </div>
  );
}

export default Demo;
