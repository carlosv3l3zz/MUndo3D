import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

// Función para convertir coordenadas geográficas a coordenadas 3D
const latLongToVector3 = (lat, lon, radius) => {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);

  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);

  return new THREE.Vector3(x, y, z);
};

// Función para crear un marcador
const createMarker = (position, color = 0xff0000) => {
  const geometry = new THREE.ConeGeometry(0.035, 0.04, 32);
  const material = new THREE.MeshBasicMaterial({ color: color });
  const marker = new THREE.Mesh(geometry, material);

  // Orientar el marcador hacia afuera de la Tierra
  marker.position.copy(position);
  marker.lookAt(new THREE.Vector3(0, 0, 0));
  marker.rotateX(Math.PI / 2);

  return marker;
};

const Ubication = () => {
  // useRef nos permite mantener una referencia al elemento DOM donde montaremos nuestra escena 3D
  const mountRef = useRef(null);
  const [selectedCity, setSelectedCity] = useState(null);
  const [isHoveringMarker, setIsHoveringMarker] = useState(false);

  useEffect(() => {
    // Crear una nueva escena 3D - es como un contenedor donde pondremos todos nuestros objetos 3D
    const scene = new THREE.Scene();

    // Configurar la cámara
    // PerspectiveCamera simula cómo vemos con nuestros ojos
    // Parámetros:
    // 1. FOV (Field of View) - 10 grados: ángulo de visión más estrecho (objeto se ve más cerca)
    // 2. Aspect ratio - relación entre ancho y alto de la pantalla
    // 3. Near plane - 0.1: distancia mínima que la cámara puede ver
    // 4. Far plane - 1000: distancia máxima que la cámara puede ver
    const camera = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );

    // Crear el renderizador WebGL que dibujará nuestra escena
    const renderer = new THREE.WebGLRenderer();

    // Establecer el tamaño del renderizador al tamaño de la ventana
    renderer.setSize(window.innerWidth, window.innerHeight);
    // Agregar el canvas del renderizador al DOM
    mountRef.current.appendChild(renderer.domElement);

    // Crear la geometría de la Tierra
    const earthGeometry = new THREE.SphereGeometry(1, 64, 64);

    // Crear la geometría de las nubes (ligeramente más grande que la Tierra)
    const cloudsGeometry = new THREE.SphereGeometry(1.01, 64, 64);

    // Crear el cargador de texturas
    const textureLoader = new THREE.TextureLoader();

    // Cargar las texturas
    const dayTexture = textureLoader.load("/images/earthAtmos.jpg");
    const nightTexture = textureLoader.load("/images/8k_earth_nightmap.jpg");

    // Cargar la textura de nubes
    const cloudsTexture = textureLoader.load(
      "/images/earthClouds.jpg"
    );
    const cloudsTexture2 = textureLoader.load("/images/earthClouds2.png");

    // Luz direccional (el "Sol") inicial
    let sunDirection = new THREE.Vector3(5, 0, 5).normalize();
    const sunRadius = 5;
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.copy(sunDirection);
    scene.add(directionalLight);

    // Posicionar la cámara 3 unidades hacia atrás en el eje Z
    // Esto nos permite ver la esfera desde una distancia
    camera.position.z = 3;

    // Crear los controles de órbita
    const controls = new OrbitControls(camera, renderer.domElement);
    // Habilitar el zoom
    controls.enableZoom = true;
    // Habilitar la rotación
    controls.enableRotate = true;
    // Habilitar el pan (movimiento lateral)
    controls.enablePan = true;

    // Variables para animación
    let time = 0;
    const earthSpeed = 0.0004; // Velocidad de rotación de la Tierra
    const cloudSpeed = 0.001; // Velocidad de rotación de las nubes
    const cloudTilt = 0.3;
    const cloudTilt2 = 0.1;
    const cloudTransitionSpeed = 1; // Velocidad de transición entre nubes

    // ShaderMaterial para mezclar día y noche
    const earthMaterial = new THREE.ShaderMaterial({
      uniforms: {
        dayTexture: { value: dayTexture },
        nightTexture: { value: nightTexture },
        sunDirection: { value: sunDirection.clone() },
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D dayTexture;
        uniform sampler2D nightTexture;
        uniform vec3 sunDirection;
        varying vec2 vUv;
        varying vec3 vNormal;
        void main() {
          float dotNL = dot(vNormal, sunDirection);
          float mixAmount = smoothstep(-0.1, 0.2, dotNL);
          vec4 dayColor = texture2D(dayTexture, vUv);
          vec4 nightColor = texture2D(nightTexture, vUv);
          vec4 color = mix(nightColor, dayColor, mixAmount);
          gl_FragColor = color;
        }
      `,
    });

    const cloudsMaterial2 = new THREE.MeshPhongMaterial({
      map: cloudsTexture2,
      transparent: true,
      opacity: 0.6,
    });

    // Material de las nubes
    const cloudsMaterial = new THREE.MeshPhongMaterial({
      map: cloudsTexture,
      transparent: true,
      opacity: 0.6,
    });

    const earth = new THREE.Mesh(earthGeometry, earthMaterial);
    const clouds = new THREE.Mesh(cloudsGeometry, cloudsMaterial);
    const clouds2 = new THREE.Mesh(cloudsGeometry, cloudsMaterial2);
    // Crear un grupo para contener todos los marcadores
    const markersGroup = new THREE.Group();
    earth.add(markersGroup); // Agregar el grupo como hijo de la Tierra

    scene.add(earth);
    scene.add(clouds);
    scene.add(clouds2);
    // Luz ambiental suave
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.05);
    scene.add(ambientLight);

    // Agregar algunos marcadores de ejemplo
    const locations = [
      { name: "Medellín", lat: 6.231961, lon: -75.568269, color: 0x0098d6 },
      { name: "Tokyo", lat: 35.6762, lon: 139.6503, color: 0x00ff00 },
      { name: "Miami", lat: 25.7617, lon: -80.1918, color: 0x5b66adf },
      { name: "España", lat: 40.4168, lon: -3.7038, color: 0xff0000 },
    ];

    // Crear un array para almacenar los marcadores y sus nombres
    const markers = [];

    locations.forEach((location) => {
      const position = latLongToVector3(location.lat, location.lon, 1.1);
      const marker = createMarker(position, location.color);
      markersGroup.add(marker);
      
      // Guardar referencia al marcador y su nombre
      markers.push({
        mesh: marker,
        name: location.name
      });
    });

    // Crear el raycaster para detectar clics
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    // Función para manejar el clic
    const onMouseClick = (event) => {
      // Calcular la posición del mouse en coordenadas normalizadas (-1 a +1)
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      // Actualizar el raycaster con la posición de la cámara y el mouse
      raycaster.setFromCamera(mouse, camera);

      // Verificar intersecciones con los marcadores
      const intersects = raycaster.intersectObjects(markers.map(m => m.mesh));

      if (intersects.length > 0) {
        // Encontrar el marcador que fue clickeado
        const clickedMarker = markers.find(m => m.mesh === intersects[0].object);
        if (clickedMarker) {
          setSelectedCity(clickedMarker.name);
          // Agregar animación
          clickedMarker.mesh.scale.set(1.5, 1.5, 1.5);
          setTimeout(() => {
            clickedMarker.mesh.scale.set(1, 1, 1);
          }, 200);
        }
      } else {
        setSelectedCity(null);
      }
    };

    // Agregar el event listener para el clic
    window.addEventListener('click', onMouseClick);

    const onMouseMove = (event) => {
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      
      const intersects = raycaster.intersectObjects(markers.map(m => m.mesh));
      
      // Resetear todos los marcadores
      markers.forEach(m => {
        m.mesh.scale.set(1, 1, 1);
      });
      
      // Resaltar el marcador bajo el mouse
      if (intersects.length > 0) {
        const hoveredMarker = markers.find(m => m.mesh === intersects[0].object);
        if (hoveredMarker) {
          hoveredMarker.mesh.scale.set(1.2, 1.2, 1.2);
          setIsHoveringMarker(true);
        }
      } else {
        setIsHoveringMarker(false);
      }
    };

    window.addEventListener('mousemove', onMouseMove);

    // Función de animación para actualizar los controles
    const animate = () => {
      requestAnimationFrame(animate);
      time += 0.003;

      // Rotar la dirección del sol alrededor de la Tierra
      sunDirection = new THREE.Vector3(
        Math.sin(time) * sunRadius,
        0,
        Math.cos(time) * sunRadius
      ).normalize();
      directionalLight.position.copy(sunDirection);

      // Rotar la Tierra sobre su eje Y
      earth.rotation.y += earthSpeed;

      const cloudOpacity = Math.sin(time * cloudTransitionSpeed);
      cloudsMaterial.opacity = cloudOpacity * 0.6;
      cloudsMaterial2.opacity = (1 - cloudOpacity) * 0.6;

      // Rotar las nubes en diferentes direcciones
      clouds.rotation.y += cloudSpeed;
      clouds2.rotation.y += cloudSpeed;
      clouds.rotation.x = Math.sin(time) * cloudTilt2;
      clouds.rotation.z = Math.cos(time) * cloudTilt;
      clouds2.rotation.x = Math.sin(time) * cloudTilt2;
      clouds2.rotation.z = Math.cos(time) * cloudTilt;

      // Actualizar la dirección del sol en el shader (en espacio local de la malla)
      const inverseMatrix = earth.matrixWorld.clone().invert();
      const localSunDirection = sunDirection
        .clone()
        .applyMatrix4(inverseMatrix)
        .normalize();
      earthMaterial.uniforms.sunDirection.value = localSunDirection;

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    // Función de limpieza que se ejecuta cuando el componente se desmonta
    return () => {
      mountRef.current.removeChild(renderer.domElement);
      window.removeEventListener('click', onMouseClick);
      window.removeEventListener('mousemove', onMouseMove);
    };
  }, []);

  return (
    <div className="relative w-screen h-screen">
      <div 
        ref={mountRef} 
        className={`w-full h-full ${isHoveringMarker ? 'cursor-pointer' : ''}`}
      />
      {selectedCity && (
        <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2 bg-white/10 border-2 border-white/40 px-4 py-2 rounded-[10px] shadow-[4px_4px_10px_rgba(255,255,255,0.4)] text-white/85">
          <h3 className="font-bold">{selectedCity}</h3>
          <p className="text-sm">Haz clic en otro lugar para cerrar</p>
        </div>
      )}
    </div>
  );
};

export default Ubication;
