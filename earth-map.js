// Script para el mapa 3D de la Tierra
(function () {
  // Función para inicializar el mapa cuando el DOM esté listo
  function initEarthMap(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Crear una nueva escena 3D
    const scene = new THREE.Scene();

    // Configurar la cámara
    const camera = new THREE.PerspectiveCamera(
      50,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );

    // Crear el renderizador WebGL
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    // Crear la geometría de la Tierra
    const earthGeometry = new THREE.SphereGeometry(1, 64, 64);
    const cloudsGeometry = new THREE.SphereGeometry(1.01, 64, 64);

    // Crear el cargador de texturas
    const textureLoader = new THREE.TextureLoader();

    // Cargar las texturas
    const dayTexture = textureLoader.load("/images/earthAtmos.jpg");
    const nightTexture = textureLoader.load("/images/8k_earth_nightmap.jpg");
    const cloudsTexture = textureLoader.load("/images/earthClouds.jpg");
    const cloudsTexture2 = textureLoader.load("/images/earthClouds2.png");

    // Luz direccional (el "Sol")
    let sunDirection = new THREE.Vector3(5, 0, 5).normalize();
    const sunRadius = 5;
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.copy(sunDirection);
    scene.add(directionalLight);

    // Posicionar la cámara
    camera.position.z = 3;

    // Crear los controles de órbita
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableZoom = true;
    controls.enableRotate = true;
    controls.enablePan = true;

    // Variables para animación
    let time = 0;
    const earthSpeed = 0.0004;
    const cloudSpeed = 0.001;
    const cloudTilt = 0.3;
    const cloudTilt2 = 0.1;
    const cloudTransitionSpeed = 1;

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

    const cloudsMaterial = new THREE.MeshPhongMaterial({
      map: cloudsTexture,
      transparent: true,
      opacity: 0.6,
    });

    const earth = new THREE.Mesh(earthGeometry, earthMaterial);
    const clouds = new THREE.Mesh(cloudsGeometry, cloudsMaterial);
    const clouds2 = new THREE.Mesh(cloudsGeometry, cloudsMaterial2);
    const markersGroup = new THREE.Group();
    earth.add(markersGroup);

    scene.add(earth);
    scene.add(clouds);
    scene.add(clouds2);

    // Luz ambiental
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.05);
    scene.add(ambientLight);

    // Marcadores
    const locations = [
      { name: "Medellín", lat: 6.231961, lon: -75.568269, color: 0x0098d6 },
      { name: "Tokyo", lat: 35.6762, lon: 139.6503, color: 0x00ff00 },
      { name: "Miami", lat: 25.7617, lon: -80.1918, color: 0x5b66adf },
      { name: "España", lat: 40.4168, lon: -3.7038, color: 0xff0000 },
    ];

    const markers = [];

    locations.forEach((location) => {
      const position = latLongToVector3(location.lat, location.lon, 1.1);
      const marker = createMarker(position, location.color);
      markersGroup.add(marker);
      markers.push({
        mesh: marker,
        name: location.name,
      });
    });

    // Raycaster para interacciones
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    // Función para manejar clics
    function onMouseClick(event) {
      const rect = container.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / container.clientWidth) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / container.clientHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(markers.map((m) => m.mesh));

      if (intersects.length > 0) {
        const clickedMarker = markers.find(
          (m) => m.mesh === intersects[0].object
        );
        if (clickedMarker) {
          showCityInfo(clickedMarker.name);
          clickedMarker.mesh.scale.set(1.5, 1.5, 1.5);
          setTimeout(() => {
            clickedMarker.mesh.scale.set(1, 1, 1);
          }, 200);
        }
      } else {
        hideCityInfo();
      }
    }

    // Función para manejar hover
    function onMouseMove(event) {
      const rect = container.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / container.clientWidth) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / container.clientHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(markers.map((m) => m.mesh));

      markers.forEach((m) => {
        m.mesh.scale.set(1, 1, 1);
      });

      if (intersects.length > 0) {
        const hoveredMarker = markers.find(
          (m) => m.mesh === intersects[0].object
        );
        if (hoveredMarker) {
          hoveredMarker.mesh.scale.set(1.2, 1.2, 1.2);
          container.style.cursor = "pointer";
        }
      } else {
        container.style.cursor = "default";
      }
    }

    // Función para mostrar información de la ciudad
    function showCityInfo(cityName) {
      let infoDiv = document.getElementById("city-info");
      if (!infoDiv) {
        infoDiv = document.createElement("div");
        infoDiv.id = "city-info";
        infoDiv.style.position = "absolute";
        infoDiv.style.top = "33%";
        infoDiv.style.left = "50%";
        infoDiv.style.transform = "translate(-50%, -50%)";
        infoDiv.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
        infoDiv.style.border = "2px solid rgba(255, 255, 255, 0.4)";
        infoDiv.style.padding = "8px 16px";
        infoDiv.style.borderRadius = "10px";
        infoDiv.style.color = "rgba(255, 255, 255, 0.85)";
        infoDiv.style.boxShadow = "4px 4px 10px rgba(255, 255, 255, 0.4)";
        container.appendChild(infoDiv);
      }
      infoDiv.innerHTML = `
                <h3 style="font-weight: bold; margin: 0;">${cityName}</h3>
                <p style="font-size: 0.875rem; margin: 4px 0 0 0;">Haz clic en otro lugar para cerrar</p>
            `;
    }

    // Función para ocultar información de la ciudad
    function hideCityInfo() {
      const infoDiv = document.getElementById("city-info");
      if (infoDiv) {
        infoDiv.remove();
      }
    }

    // Event listeners
    container.addEventListener("click", onMouseClick);
    container.addEventListener("mousemove", onMouseMove);

    // Función de animación
    function animate() {
      requestAnimationFrame(animate);
      time += 0.003;

      sunDirection = new THREE.Vector3(
        Math.sin(time) * sunRadius,
        0,
        Math.cos(time) * sunRadius
      ).normalize();
      directionalLight.position.copy(sunDirection);

      earth.rotation.y += earthSpeed;

      const cloudOpacity = Math.sin(time * cloudTransitionSpeed);
      cloudsMaterial.opacity = cloudOpacity * 0.6;
      cloudsMaterial2.opacity = (1 - cloudOpacity) * 0.6;

      clouds.rotation.y += cloudSpeed;
      clouds2.rotation.y += cloudSpeed;
      clouds.rotation.x = Math.sin(time) * cloudTilt2;
      clouds.rotation.z = Math.cos(time) * cloudTilt;
      clouds2.rotation.x = Math.sin(time) * cloudTilt2;
      clouds2.rotation.z = Math.cos(time) * cloudTilt;

      const inverseMatrix = earth.matrixWorld.clone().invert();
      const localSunDirection = sunDirection
        .clone()
        .applyMatrix4(inverseMatrix)
        .normalize();
      earthMaterial.uniforms.sunDirection.value = localSunDirection;

      controls.update();
      renderer.render(scene, camera);
    }

    // Manejar redimensionamiento
    window.addEventListener("resize", function () {
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    });

    // Iniciar animación
    animate();
  }

  // Función para convertir coordenadas geográficas a coordenadas 3D
  function latLongToVector3(lat, lon, radius) {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);

    const x = -(radius * Math.sin(phi) * Math.cos(theta));
    const z = radius * Math.sin(phi) * Math.sin(theta);
    const y = radius * Math.cos(phi);

    return new THREE.Vector3(x, y, z);
  }

  // Función para crear un marcador
  function createMarker(position, color = 0xff0000) {
    const geometry = new THREE.ConeGeometry(0.035, 0.04, 32);
    const material = new THREE.MeshBasicMaterial({ color: color });
    const marker = new THREE.Mesh(geometry, material);

    marker.position.copy(position);
    marker.lookAt(new THREE.Vector3(0, 0, 0));
    marker.rotateX(Math.PI / 2);
    return marker;
  }

  // Exponer la función al objeto window
  window.initEarthMap = initEarthMap;
})();
