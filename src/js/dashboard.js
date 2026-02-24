/**
 * AICO Fire Detection System - Premium Industrial Dashboard
 * Digital Twin & Engineering Precision Theme
 * Three.js 3D Visualization + HUD Interface
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
    colors: {
        deepCarbon: 0x0b0c10,
        darkSlate: 0x1f2833,
        accentTeal: 0x45a29e,
        accentCyan: 0x66fcf1,
        warning: 0xff9f1c,
        critical: 0xe63946,
        normal: 0x45a29e,
        wireframe: 0x45a29e,
        grid: 0x1a2634
    },
    bootSequence: {
        duration: 3500,
        messages: [
            'Initializing core systems...',
            'Loading sensor modules...',
            'Establishing MQTT connection...',
            'Calibrating Digital Twin...',
            'Rendering 3D environment...',
            'Loading UI components...',
            'System ready.'
        ]
    },
    oscilloscope: {
        maxPoints: 60,
        lineWidth: 2,
        glowIntensity: 15
    },
    threejs: {
        buildingWidth: 12,
        buildingHeight: 8,
        buildingDepth: 10,
        floorCount: 3
    }
};

// ============================================================================
// BOOT SEQUENCE
// ============================================================================

class BootSequence {
    constructor() {
        this.overlay = document.getElementById('bootOverlay');
        this.progressBar = document.getElementById('bootProgress');
        this.statusText = document.getElementById('bootStatus');
        this.logContainer = document.getElementById('bootLog');
        this.progress = 0;
        this.messageIndex = 0;
    }

    start() {
        return new Promise((resolve) => {
            const totalDuration = CONFIG.bootSequence.duration;
            const messageInterval = totalDuration / CONFIG.bootSequence.messages.length;

            const progressInterval = setInterval(() => {
                this.progress += 2;
                if (this.progressBar) {
                    this.progressBar.style.width = `${Math.min(this.progress, 100)}%`;
                }

                if (this.progress >= 100) {
                    clearInterval(progressInterval);
                }
            }, totalDuration / 50);

            const messageTimer = setInterval(() => {
                if (this.messageIndex < CONFIG.bootSequence.messages.length) {
                    this.addLogMessage(CONFIG.bootSequence.messages[this.messageIndex]);
                    if (this.statusText) {
                        this.statusText.textContent = CONFIG.bootSequence.messages[this.messageIndex].toUpperCase();
                    }
                    this.messageIndex++;
                } else {
                    clearInterval(messageTimer);
                }
            }, messageInterval);

            setTimeout(() => {
                this.complete();
                resolve();
            }, totalDuration);
        });
    }

    addLogMessage(message) {
        if (!this.logContainer) return;
        const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
        const logLine = document.createElement('div');
        logLine.className = 'boot-log-line';
        logLine.innerHTML = `<span class="log-time">[${timestamp}]</span> <span class="log-msg">${message}</span>`;
        this.logContainer.appendChild(logLine);
        this.logContainer.scrollTop = this.logContainer.scrollHeight;
    }

    complete() {
        if (this.overlay) {
            this.overlay.classList.add('fade-out');
            setTimeout(() => {
                this.overlay.style.display = 'none';
            }, 500);
        }
    }
}

// ============================================================================
// THREE.JS DIGITAL TWIN
// ============================================================================

class DigitalTwin {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.canvas = document.getElementById('threejsCanvas');
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.building = null;
        this.sensorNodes = new Map();
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.isInitialized = false;
        this.animationId = null;
        this.tooltip = document.getElementById('sensorTooltip');

        if (this.container && this.canvas && typeof THREE !== 'undefined') {
            this.init();
        }
    }

    init() {
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;

        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(CONFIG.colors.deepCarbon);
        this.scene.fog = new THREE.Fog(CONFIG.colors.deepCarbon, 20, 60);

        // Camera - Isometric view
        this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
        this.camera.position.set(20, 15, 20);
        this.camera.lookAt(0, 2, 0);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: true
        });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // Lights
        this.setupLights();

        // Grid
        this.createGrid();

        // Building
        this.createBuilding();

        // Sensor Nodes
        this.createSensorNodes();

        // Events
        this.setupEvents();

        // Animation
        this.isInitialized = true;
        this.animate();
    }

    setupLights() {
        // Ambient
        const ambient = new THREE.AmbientLight(0x404040, 0.5);
        this.scene.add(ambient);

        // Main directional
        const directional = new THREE.DirectionalLight(0xffffff, 0.8);
        directional.position.set(10, 20, 10);
        directional.castShadow = true;
        directional.shadow.mapSize.width = 2048;
        directional.shadow.mapSize.height = 2048;
        this.scene.add(directional);

        // Accent light (teal)
        const tealLight = new THREE.PointLight(CONFIG.colors.accentTeal, 1, 30);
        tealLight.position.set(-5, 10, 5);
        this.scene.add(tealLight);

        // Rim light
        const rimLight = new THREE.PointLight(0x66fcf1, 0.5, 40);
        rimLight.position.set(15, 5, -10);
        this.scene.add(rimLight);
    }

    createGrid() {
        const gridHelper = new THREE.GridHelper(40, 40, CONFIG.colors.accentTeal, CONFIG.colors.grid);
        gridHelper.position.y = -0.01;
        gridHelper.material.opacity = 0.3;
        gridHelper.material.transparent = true;
        this.scene.add(gridHelper);

        // Ground plane with subtle glow
        const groundGeometry = new THREE.PlaneGeometry(50, 50);
        const groundMaterial = new THREE.MeshStandardMaterial({
            color: CONFIG.colors.deepCarbon,
            transparent: true,
            opacity: 0.8,
            roughness: 0.9,
            metalness: 0.1
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -0.02;
        ground.receiveShadow = true;
        this.scene.add(ground);
    }

    createBuilding() {
        const { buildingWidth, buildingHeight, buildingDepth, floorCount } = CONFIG.threejs;
        this.building = new THREE.Group();

        // Main structure - wireframe style
        const mainGeometry = new THREE.BoxGeometry(buildingWidth, buildingHeight, buildingDepth);

        // Solid interior (dark, semi-transparent)
        const solidMaterial = new THREE.MeshPhongMaterial({
            color: CONFIG.colors.darkSlate,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide
        });
        const solidMesh = new THREE.Mesh(mainGeometry, solidMaterial);
        solidMesh.position.y = buildingHeight / 2;
        this.building.add(solidMesh);

        // Wireframe edges
        const edgesGeometry = new THREE.EdgesGeometry(mainGeometry);
        const edgesMaterial = new THREE.LineBasicMaterial({
            color: CONFIG.colors.accentTeal,
            transparent: true,
            opacity: 0.8
        });
        const edges = new THREE.LineSegments(edgesGeometry, edgesMaterial);
        edges.position.y = buildingHeight / 2;
        this.building.add(edges);

        // Floor separators
        const floorHeight = buildingHeight / floorCount;
        for (let i = 1; i < floorCount; i++) {
            const floorGeometry = new THREE.PlaneGeometry(buildingWidth - 0.2, buildingDepth - 0.2);
            const floorMaterial = new THREE.MeshBasicMaterial({
                color: CONFIG.colors.accentTeal,
                transparent: true,
                opacity: 0.15,
                side: THREE.DoubleSide
            });
            const floor = new THREE.Mesh(floorGeometry, floorMaterial);
            floor.rotation.x = -Math.PI / 2;
            floor.position.y = i * floorHeight;
            this.building.add(floor);

            // Floor edge lines
            const floorEdge = new THREE.EdgesGeometry(floorGeometry);
            const floorEdgeLine = new THREE.LineSegments(
                floorEdge,
                new THREE.LineBasicMaterial({ color: CONFIG.colors.accentCyan, transparent: true, opacity: 0.5 })
            );
            floorEdgeLine.rotation.x = -Math.PI / 2;
            floorEdgeLine.position.y = i * floorHeight;
            this.building.add(floorEdgeLine);
        }

        // Corner pillars with glow effect
        const pillarPositions = [
            [-buildingWidth/2 + 0.3, 0, -buildingDepth/2 + 0.3],
            [buildingWidth/2 - 0.3, 0, -buildingDepth/2 + 0.3],
            [-buildingWidth/2 + 0.3, 0, buildingDepth/2 - 0.3],
            [buildingWidth/2 - 0.3, 0, buildingDepth/2 - 0.3]
        ];

        pillarPositions.forEach(pos => {
            const pillarGeometry = new THREE.CylinderGeometry(0.15, 0.15, buildingHeight, 8);
            const pillarMaterial = new THREE.MeshPhongMaterial({
                color: CONFIG.colors.accentCyan,
                emissive: CONFIG.colors.accentTeal,
                emissiveIntensity: 0.3,
                transparent: true,
                opacity: 0.7
            });
            const pillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
            pillar.position.set(pos[0], buildingHeight / 2, pos[2]);
            this.building.add(pillar);
        });

        this.scene.add(this.building);
    }

    createSensorNodes() {
        const sensorPositions = {
            'temperature': { x: -3, y: 6, z: 2, floor: 2 },
            'humidity': { x: 3, y: 6, z: -2, floor: 2 },
            'gas': { x: 0, y: 4, z: 0, floor: 1 },
            'air-quality': { x: -4, y: 4, z: -3, floor: 1 },
            'no2': { x: 4, y: 2, z: 3, floor: 0 },
            'co': { x: -2, y: 2, z: -4, floor: 0 },
            'tvoc': { x: 2, y: 6, z: 3, floor: 2 },
            'eco2': { x: -4, y: 4, z: 3, floor: 1 },
            'surface-temp': { x: 0, y: 2, z: -3, floor: 0 },
            'surface-temp-2': { x: 3, y: 4, z: 0, floor: 1 },
            'pressure': { x: -3, y: 2, z: 2, floor: 0 },
            'current': { x: 4, y: 6, z: -3, floor: 2 }
        };

        Object.entries(sensorPositions).forEach(([sensorId, pos]) => {
            const node = this.createSensorNode(sensorId, pos);
            this.sensorNodes.set(sensorId, node);
            this.building.add(node.group);
        });
    }

    createSensorNode(sensorId, position) {
        const group = new THREE.Group();
        group.position.set(position.x, position.y, position.z);

        // Core sphere
        const coreGeometry = new THREE.SphereGeometry(0.25, 16, 16);
        const coreMaterial = new THREE.MeshPhongMaterial({
            color: CONFIG.colors.normal,
            emissive: CONFIG.colors.normal,
            emissiveIntensity: 0.5,
            transparent: true,
            opacity: 0.9
        });
        const core = new THREE.Mesh(coreGeometry, coreMaterial);
        group.add(core);

        // Outer ring
        const ringGeometry = new THREE.RingGeometry(0.35, 0.4, 32);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: CONFIG.colors.accentCyan,
            transparent: true,
            opacity: 0.6,
            side: THREE.DoubleSide
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = -Math.PI / 2;
        group.add(ring);

        // Pulse effect ring
        const pulseGeometry = new THREE.RingGeometry(0.4, 0.45, 32);
        const pulseMaterial = new THREE.MeshBasicMaterial({
            color: CONFIG.colors.accentTeal,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide
        });
        const pulse = new THREE.Mesh(pulseGeometry, pulseMaterial);
        pulse.rotation.x = -Math.PI / 2;
        group.add(pulse);

        // Connection line to floor
        const lineGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, -position.y, 0)
        ]);
        const lineMaterial = new THREE.LineBasicMaterial({
            color: CONFIG.colors.accentTeal,
            transparent: true,
            opacity: 0.3
        });
        const line = new THREE.Line(lineGeometry, lineMaterial);
        group.add(line);

        // Store reference for updates
        group.userData = {
            sensorId,
            core,
            ring,
            pulse,
            coreMaterial,
            status: 'normal',
            value: 0
        };

        return {
            group,
            core,
            ring,
            pulse,
            coreMaterial,
            position
        };
    }

    updateSensorStatus(sensorId, status, value) {
        const node = this.sensorNodes.get(sensorId);
        if (!node) return;

        let color;
        let emissiveIntensity;

        switch (status) {
            case 'critical':
                color = CONFIG.colors.critical;
                emissiveIntensity = 1.0;
                break;
            case 'warning':
                color = CONFIG.colors.warning;
                emissiveIntensity = 0.7;
                break;
            default:
                color = CONFIG.colors.normal;
                emissiveIntensity = 0.5;
        }

        node.coreMaterial.color.setHex(color);
        node.coreMaterial.emissive.setHex(color);
        node.coreMaterial.emissiveIntensity = emissiveIntensity;
        node.group.userData.status = status;
        node.group.userData.value = value;
    }

    setupEvents() {
        window.addEventListener('resize', () => this.onResize());
        if (this.container) {
            this.container.addEventListener('mousemove', (e) => this.onMouseMove(e));
        }
    }

    onResize() {
        if (!this.container || !this.camera || !this.renderer) return;

        const width = this.container.clientWidth;
        const height = this.container.clientHeight;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    onMouseMove(event) {
        if (!this.container) return;
        const rect = this.container.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);

        const sensorMeshes = [];
        this.sensorNodes.forEach((node) => {
            sensorMeshes.push(node.core);
        });

        const intersects = this.raycaster.intersectObjects(sensorMeshes);

        if (intersects.length > 0 && this.tooltip) {
            const sensorData = intersects[0].object.parent.userData;
            this.tooltip.style.display = 'block';
            this.tooltip.style.left = `${event.clientX - rect.left + 15}px`;
            this.tooltip.style.top = `${event.clientY - rect.top - 10}px`;
            this.tooltip.innerHTML = `
                <div class="tooltip-title">${this.getSensorName(sensorData.sensorId)}</div>
                <div class="tooltip-value">${sensorData.value.toFixed(2)}</div>
                <div class="tooltip-status ${sensorData.status}">${sensorData.status.toUpperCase()}</div>
            `;
        } else if (this.tooltip) {
            this.tooltip.style.display = 'none';
        }
    }

    getSensorName(sensorId) {
        const names = {
            'temperature': 'Temperature',
            'humidity': 'Humidity',
            'gas': 'Gas Resistance',
            'air-quality': 'Air Quality',
            'no2': 'NO2',
            'co': 'CO',
            'tvoc': 'TVOC',
            'eco2': 'eCO2',
            'surface-temp': 'Surface Temp 1',
            'surface-temp-2': 'Surface Temp 2',
            'pressure': 'Pressure',
            'current': 'Current'
        };
        return names[sensorId] || sensorId;
    }

    animate() {
        if (!this.isInitialized) return;

        this.animationId = requestAnimationFrame(() => this.animate());

        const time = Date.now() * 0.001;

        // Rotate building slowly
        if (this.building) {
            this.building.rotation.y = Math.sin(time * 0.1) * 0.1;
        }

        // Animate sensor nodes
        this.sensorNodes.forEach((node, sensorId) => {
            // Pulse animation
            const pulseScale = 1 + Math.sin(time * 2) * 0.2;
            node.pulse.scale.set(pulseScale, pulseScale, 1);
            node.pulse.material.opacity = 0.3 - Math.sin(time * 2) * 0.15;

            // Ring rotation
            node.ring.rotation.z = time * 0.5;

            // Critical status pulsing
            if (node.group.userData.status === 'critical') {
                const intensity = 0.7 + Math.sin(time * 5) * 0.3;
                node.coreMaterial.emissiveIntensity = intensity;
            }
        });

        this.renderer.render(this.scene, this.camera);
    }

    dispose() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        if (this.renderer) {
            this.renderer.dispose();
        }
    }
}

// ============================================================================
// OSCILLOSCOPE CHART
// ============================================================================

class OscilloscopeChart {
    constructor(canvas, options = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.data = [];
        this.maxPoints = options.maxPoints || CONFIG.oscilloscope.maxPoints;
        this.color = options.color || '#45a29e';
        this.glowColor = options.glowColor || '#66fcf1';
        this.gridColor = options.gridColor || 'rgba(69, 162, 158, 0.1)';
        this.min = options.min || 0;
        this.max = options.max || 100;
        this.unit = options.unit || '';
        this.label = options.label || '';

        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        if (!this.canvas.parentElement) return;
        const rect = this.canvas.parentElement.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
        this.ctx.scale(dpr, dpr);
        this.width = rect.width;
        this.height = rect.height;
    }

    addPoint(value) {
        this.data.push(value);
        if (this.data.length > this.maxPoints) {
            this.data.shift();
        }
        this.render();
    }

    render() {
        const ctx = this.ctx;
        const { width, height } = this;

        if (!width || !height) return;

        // Clear
        ctx.clearRect(0, 0, width, height);

        // Background gradient
        const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
        bgGradient.addColorStop(0, 'rgba(11, 12, 16, 0.9)');
        bgGradient.addColorStop(1, 'rgba(31, 40, 51, 0.9)');
        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, width, height);

        // Grid lines
        ctx.strokeStyle = this.gridColor;
        ctx.lineWidth = 1;

        // Horizontal grid
        const hLines = 4;
        for (let i = 1; i < hLines; i++) {
            const y = (height / hLines) * i;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }

        // Vertical grid
        const vLines = 6;
        for (let i = 1; i < vLines; i++) {
            const x = (width / vLines) * i;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }

        if (this.data.length < 2) return;

        // Calculate points
        const points = this.data.map((value, index) => {
            const x = (index / (this.maxPoints - 1)) * width;
            const normalizedValue = (value - this.min) / (this.max - this.min);
            const y = height - (normalizedValue * (height - 20)) - 10;
            return { x, y };
        });

        // Glow effect
        ctx.save();
        ctx.shadowColor = this.glowColor;
        ctx.shadowBlur = CONFIG.oscilloscope.glowIntensity;
        ctx.strokeStyle = this.color;
        ctx.lineWidth = CONFIG.oscilloscope.lineWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Draw line
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);

        for (let i = 1; i < points.length; i++) {
            const prev = points[i - 1];
            const curr = points[i];
            const midX = (prev.x + curr.x) / 2;
            const midY = (prev.y + curr.y) / 2;
            ctx.quadraticCurveTo(prev.x, prev.y, midX, midY);
        }
        ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
        ctx.stroke();

        // Fill gradient under line
        ctx.lineTo(width, height);
        ctx.lineTo(0, height);
        ctx.closePath();

        const fillGradient = ctx.createLinearGradient(0, 0, 0, height);
        fillGradient.addColorStop(0, this.hexToRgba(this.color, 0.3));
        fillGradient.addColorStop(1, this.hexToRgba(this.color, 0.0));
        ctx.fillStyle = fillGradient;
        ctx.fill();

        ctx.restore();

        // Current value display
        if (this.data.length > 0) {
            const currentValue = this.data[this.data.length - 1];
            ctx.font = 'bold 14px "Rajdhani", sans-serif';
            ctx.fillStyle = this.glowColor;
            ctx.textAlign = 'right';
            ctx.fillText(`${currentValue.toFixed(1)}${this.unit}`, width - 8, 20);
        }

        // Scan line effect
        const scanLinePos = (Date.now() % 3000) / 3000;
        const scanX = scanLinePos * width;
        const scanGradient = ctx.createLinearGradient(scanX - 30, 0, scanX + 30, 0);
        scanGradient.addColorStop(0, 'rgba(102, 252, 241, 0)');
        scanGradient.addColorStop(0.5, 'rgba(102, 252, 241, 0.1)');
        scanGradient.addColorStop(1, 'rgba(102, 252, 241, 0)');
        ctx.fillStyle = scanGradient;
        ctx.fillRect(scanX - 30, 0, 60, height);
    }

    hexToRgba(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    setColor(color, glowColor) {
        this.color = color;
        this.glowColor = glowColor || color;
    }
}

// ============================================================================
// COCKPIT GAUGE
// ============================================================================

class CockpitGauge {
    constructor(container, options = {}) {
        this.container = container;
        this.value = options.value || 0;
        this.min = options.min || 0;
        this.max = options.max || 100;
        this.label = options.label || '';
        this.unit = options.unit || '';
        this.warningThreshold = options.warningThreshold || 70;
        this.criticalThreshold = options.criticalThreshold || 90;

        this.render();
    }

    render() {
        const percentage = ((this.value - this.min) / (this.max - this.min)) * 100;
        const angle = (percentage / 100) * 270 - 135; // -135 to 135 degrees

        let statusColor = '#45a29e';
        let statusClass = 'normal';

        if (this.value >= this.criticalThreshold) {
            statusColor = '#e63946';
            statusClass = 'critical';
        } else if (this.value >= this.warningThreshold) {
            statusColor = '#ff9f1c';
            statusClass = 'warning';
        }

        // Create tick marks
        let ticks = '';
        for (let i = 0; i <= 27; i++) {
            const tickAngle = -135 + (i * 10);
            const isMajor = i % 3 === 0;
            const tickClass = isMajor ? 'tick-major' : 'tick-minor';
            ticks += `<line class="gauge-tick ${tickClass}"
                x1="50" y1="${isMajor ? 8 : 10}"
                x2="50" y2="${isMajor ? 15 : 13}"
                transform="rotate(${tickAngle} 50 50)"/>`;
        }

        this.container.innerHTML = `
            <svg class="gauge-svg" viewBox="0 0 100 100">
                <defs>
                    <linearGradient id="gaugeGradient${this.label}" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" style="stop-color:#45a29e"/>
                        <stop offset="70%" style="stop-color:#ff9f1c"/>
                        <stop offset="100%" style="stop-color:#e63946"/>
                    </linearGradient>
                    <filter id="glow${this.label}">
                        <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                        <feMerge>
                            <feMergeNode in="coloredBlur"/>
                            <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                    </filter>
                </defs>

                <!-- Background arc -->
                <circle class="gauge-bg" cx="50" cy="50" r="40"
                    stroke="rgba(69, 162, 158, 0.2)"
                    stroke-width="6"
                    fill="none"
                    stroke-dasharray="188.5 62.8"
                    stroke-dashoffset="-31.4"
                    transform="rotate(-90 50 50)"/>

                <!-- Value arc -->
                <circle class="gauge-value" cx="50" cy="50" r="40"
                    stroke="${statusColor}"
                    stroke-width="6"
                    fill="none"
                    stroke-dasharray="${188.5 * percentage / 100} ${251.3 - 188.5 * percentage / 100}"
                    stroke-dashoffset="-31.4"
                    transform="rotate(-90 50 50)"
                    filter="url(#glow${this.label})"/>

                <!-- Tick marks -->
                <g class="gauge-ticks" stroke="rgba(102, 252, 241, 0.5)" stroke-width="1">
                    ${ticks}
                </g>

                <!-- Needle -->
                <g class="gauge-needle" transform="rotate(${angle} 50 50)">
                    <line x1="50" y1="50" x2="50" y2="18"
                        stroke="${statusColor}"
                        stroke-width="2"
                        filter="url(#glow${this.label})"/>
                    <circle cx="50" cy="50" r="4" fill="${statusColor}"/>
                </g>

                <!-- Center -->
                <circle cx="50" cy="50" r="6" fill="#1f2833" stroke="#45a29e" stroke-width="1"/>

                <!-- Value text -->
                <text x="50" y="70" class="gauge-value-text"
                    fill="${statusColor}"
                    text-anchor="middle"
                    font-family="Orbitron, monospace"
                    font-size="10"
                    font-weight="bold">
                    ${this.value.toFixed(1)}
                </text>

                <!-- Unit text -->
                <text x="50" y="80" class="gauge-unit-text"
                    fill="rgba(102, 252, 241, 0.7)"
                    text-anchor="middle"
                    font-family="Roboto Mono, monospace"
                    font-size="6">
                    ${this.unit}
                </text>
            </svg>
            <div class="gauge-label">${this.label}</div>
        `;
    }

    setValue(value) {
        this.value = Math.max(this.min, Math.min(this.max, value));
        this.render();
    }
}

// ============================================================================
// MAIN DASHBOARD CLASS
// ============================================================================

class ModernFireDashboard {
    constructor() {
        this.sensors = this.initializeSensors();
        this.systemState = {
            connectionStatus: 'connecting',
            lastUpdate: null,
            alertCount: 0,
            boardHealth: 100
        };
        this.charts = new Map();
        this.gauges = new Map();
        this.digitalTwin = null;
        this.currentPage = 'dashboard';
        this.selectedDevice = 'all';

        this.init();
    }

    initializeSensors() {
        return {
            'temperature': { value: 0, unit: '°C', min: -20, max: 80, history: [], status: 'normal', trend: 'stable', label: 'Temperature' },
            'humidity': { value: 0, unit: '%', min: 0, max: 100, history: [], status: 'normal', trend: 'stable', label: 'Humidity' },
            'gas': { value: 0, unit: 'kOhm', min: 0, max: 500, history: [], status: 'normal', trend: 'stable', label: 'Gas Resistance' },
            'air-quality': { value: 0, unit: 'IAQ', min: 0, max: 500, history: [], status: 'normal', trend: 'stable', label: 'Air Quality' },
            'no2': { value: 0, unit: 'ppm', min: 0, max: 10, history: [], status: 'normal', trend: 'stable', label: 'NO2' },
            'co': { value: 0, unit: 'ppm', min: 0, max: 100, history: [], status: 'normal', trend: 'stable', label: 'CO' },
            'tvoc': { value: 0, unit: 'ppb', min: 0, max: 1000, history: [], status: 'normal', trend: 'stable', label: 'TVOC' },
            'eco2': { value: 0, unit: 'ppm', min: 400, max: 5000, history: [], status: 'normal', trend: 'stable', label: 'eCO2' },
            'surface-temp': { value: 0, unit: '°C', min: -20, max: 150, history: [], status: 'normal', trend: 'stable', label: 'Surface Temp 1' },
            'surface-temp-2': { value: 0, unit: '°C', min: -20, max: 150, history: [], status: 'normal', trend: 'stable', label: 'Surface Temp 2' },
            'pressure': { value: 0, unit: 'hPa', min: 900, max: 1100, history: [], status: 'normal', trend: 'stable', label: 'Pressure' },
            'current': { value: 0, unit: 'mA', min: 0, max: 1000, history: [], status: 'normal', trend: 'stable', label: 'Current' }
        };
    }

    async init() {
        // Boot sequence
        const bootSequence = new BootSequence();
        await bootSequence.start();

        // Initialize components
        this.initializeNavigation();
        this.initializeCharts();
        this.initializeGauges();
        this.initializeDigitalTwin();
        this.initializeDeviceSelector();
        this.initializeEventListeners();

        // Update timestamp
        this.updateTimestamp();
        setInterval(() => this.updateTimestamp(), 1000);

        // Process pending MQTT data if any
        if (window.pendingMQTTData) {
            this.updateDashboardFromMQTT(window.pendingMQTTData.sensorData, window.pendingMQTTData.anomalySensorIds);
            window.pendingMQTTData = null;
        }

        // Expose to window for MQTT integration
        window.modernFireDashboard = this;
    }

    initializeNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                const page = item.dataset.page;
                this.switchPage(page);

                navItems.forEach(ni => ni.classList.remove('active'));
                item.classList.add('active');
            });
        });
    }

    switchPage(page) {
        this.currentPage = page;

        document.querySelectorAll('.page').forEach(p => {
            p.classList.remove('active');
        });

        const targetPage = document.getElementById(`${page}Page`);
        if (targetPage) {
            targetPage.classList.add('active');
        }
    }

    initializeCharts() {
        const chartConfigs = {
            'temperature': { color: '#e63946', glowColor: '#ff6b6b', min: -20, max: 80, unit: '°C' },
            'humidity': { color: '#45a29e', glowColor: '#66fcf1', min: 0, max: 100, unit: '%' },
            'gas': { color: '#ff9f1c', glowColor: '#ffbe0b', min: 0, max: 500, unit: 'kOhm' },
            'air-quality': { color: '#8338ec', glowColor: '#b185db', min: 0, max: 500, unit: 'IAQ' },
            'no2': { color: '#3a86ff', glowColor: '#72a8ff', min: 0, max: 10, unit: 'ppm' },
            'co': { color: '#ff006e', glowColor: '#ff5c9e', min: 0, max: 100, unit: 'ppm' },
            'tvoc': { color: '#fb5607', glowColor: '#ff8a4c', min: 0, max: 1000, unit: 'ppb' },
            'eco2': { color: '#8ac926', glowColor: '#b3e048', min: 400, max: 5000, unit: 'ppm' },
            'surface-temp': { color: '#e63946', glowColor: '#ff6b6b', min: -20, max: 150, unit: '°C' },
            'surface-temp-2': { color: '#f77f00', glowColor: '#ffa94d', min: -20, max: 150, unit: '°C' },
            'pressure': { color: '#4361ee', glowColor: '#738eff', min: 900, max: 1100, unit: 'hPa' },
            'current': { color: '#7209b7', glowColor: '#9d4edd', min: 0, max: 1000, unit: 'mA' }
        };

        Object.entries(chartConfigs).forEach(([sensorId, config]) => {
            const canvas = document.getElementById(`${sensorId}Chart`);
            if (canvas) {
                const chart = new OscilloscopeChart(canvas, {
                    ...config,
                    label: this.sensors[sensorId]?.label || sensorId
                });
                this.charts.set(sensorId, chart);
            }
        });
    }

    initializeGauges() {
        const gaugeConfigs = {
            'gauge1': { label: 'TEMP', unit: '°C', min: 0, max: 100, warningThreshold: 60, criticalThreshold: 80 },
            'gauge2': { label: 'HUM', unit: '%', min: 0, max: 100, warningThreshold: 70, criticalThreshold: 85 },
            'gauge3': { label: 'CO', unit: 'ppm', min: 0, max: 100, warningThreshold: 35, criticalThreshold: 70 },
            'gauge4': { label: 'IAQ', unit: '', min: 0, max: 500, warningThreshold: 150, criticalThreshold: 250 }
        };

        Object.entries(gaugeConfigs).forEach(([id, config]) => {
            const container = document.getElementById(id);
            if (container) {
                const gauge = new CockpitGauge(container, config);
                this.gauges.set(id, gauge);
            }
        });
    }

    initializeDigitalTwin() {
        this.digitalTwin = new DigitalTwin('threejsContainer');
    }

    initializeDeviceSelector() {
        const selector = document.getElementById('deviceSelector');
        if (selector) {
            selector.addEventListener('change', (e) => {
                this.selectedDevice = e.target.value;
                this.filterByDevice();
            });
        }
    }

    filterByDevice() {
        console.log(`Filtering by device: ${this.selectedDevice}`);
    }

    initializeEventListeners() {
        // Modal close
        const modal = document.getElementById('sensorModal');
        const closeBtn = document.querySelector('.modal-close');

        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                modal.classList.remove('active');
            });
        }

        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                }
            });
        }

        // Sensor card clicks
        document.querySelectorAll('.sensor-card').forEach(card => {
            card.addEventListener('click', () => {
                const sensorId = card.dataset.sensor;
                this.showSensorDetail(sensorId);
            });
        });

        // Escape key to close modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal) {
                modal.classList.remove('active');
            }
        });
    }

    showSensorDetail(sensorId) {
        const sensor = this.sensors[sensorId];
        if (!sensor) return;

        const modal = document.getElementById('sensorModal');
        const title = document.getElementById('modalSensorTitle');
        const content = document.getElementById('modalSensorContent');

        if (title) {
            title.textContent = sensor.label;
        }

        if (content) {
            content.innerHTML = `
                <div class="modal-stats">
                    <div class="modal-stat">
                        <span class="stat-label">Current Value</span>
                        <span class="stat-value">${sensor.value.toFixed(2)} ${sensor.unit}</span>
                    </div>
                    <div class="modal-stat">
                        <span class="stat-label">Status</span>
                        <span class="stat-value status-${sensor.status}">${sensor.status.toUpperCase()}</span>
                    </div>
                    <div class="modal-stat">
                        <span class="stat-label">Trend</span>
                        <span class="stat-value">${sensor.trend}</span>
                    </div>
                    <div class="modal-stat">
                        <span class="stat-label">Range</span>
                        <span class="stat-value">${sensor.min} - ${sensor.max} ${sensor.unit}</span>
                    </div>
                </div>
                <div class="modal-history">
                    <h4>Recent History</h4>
                    <div class="history-values">
                        ${sensor.history.slice(-10).map(v => `<span>${v.toFixed(1)}</span>`).join('')}
                    </div>
                </div>
            `;
        }

        if (modal) {
            modal.classList.add('active');
        }
    }

    updateSensorValue(sensorId, value) {
        const sensor = this.sensors[sensorId];
        if (!sensor) return;

        sensor.value = value;

        // Update DOM
        const valueEl = document.querySelector(`[data-sensor="${sensorId}"] .sensor-value`);
        if (valueEl) {
            valueEl.textContent = value.toFixed(2);
        }
    }

    updateSensorHistory(sensorId, value) {
        const sensor = this.sensors[sensorId];
        if (!sensor) return;

        sensor.history.push(value);
        if (sensor.history.length > CONFIG.oscilloscope.maxPoints) {
            sensor.history.shift();
        }
    }

    updateTrendIndicator(sensorId) {
        const sensor = this.sensors[sensorId];
        if (!sensor || sensor.history.length < 3) return;

        const recent = sensor.history.slice(-5);
        const avg = recent.reduce((a, b) => a + b, 0) / recent.length;
        const lastValue = recent[recent.length - 1];
        const diff = lastValue - avg;
        const threshold = (sensor.max - sensor.min) * 0.02;

        if (diff > threshold) {
            sensor.trend = 'rising';
        } else if (diff < -threshold) {
            sensor.trend = 'falling';
        } else {
            sensor.trend = 'stable';
        }
    }

    updateStatusBadge(sensorId, status) {
        const badge = document.querySelector(`[data-sensor="${sensorId}"] .status-badge`);
        if (badge) {
            badge.className = `status-badge ${status}`;
            badge.textContent = status.toUpperCase();
        }
    }

    updateTrendDisplay(sensorId, trend) {
        const trendEl = document.querySelector(`[data-sensor="${sensorId}"] .trend-indicator`);
        if (trendEl) {
            trendEl.className = `trend-indicator ${trend}`;
            const icons = { rising: '↑', falling: '↓', stable: '→' };
            trendEl.textContent = icons[trend] || '→';
        }
    }

    updateCardStyling(sensorId, status) {
        const card = document.querySelector(`[data-sensor="${sensorId}"]`);
        if (card) {
            card.classList.remove('status-normal', 'status-warning', 'status-critical');
            card.classList.add(`status-${status}`);
        }
    }

    renderChart(sensorId) {
        const chart = this.charts.get(sensorId);
        const sensor = this.sensors[sensorId];

        if (chart && sensor) {
            chart.addPoint(sensor.value);

            // Update color based on status
            if (sensor.status === 'critical') {
                chart.setColor('#e63946', '#ff6b6b');
            } else if (sensor.status === 'warning') {
                chart.setColor('#ff9f1c', '#ffbe0b');
            }
        }
    }

    updateSystemStatus() {
        // Count alerts
        let criticalCount = 0;
        let warningCount = 0;

        Object.values(this.sensors).forEach(sensor => {
            if (sensor.status === 'critical') criticalCount++;
            else if (sensor.status === 'warning') warningCount++;
        });

        this.systemState.alertCount = criticalCount + warningCount;

        // Update alert badge
        const alertBadge = document.querySelector('.alert-badge');
        if (alertBadge) {
            alertBadge.textContent = this.systemState.alertCount;
            alertBadge.style.display = this.systemState.alertCount > 0 ? 'flex' : 'none';
        }

        // Update header stats
        const activeSensors = document.getElementById('activeSensors');
        if (activeSensors) {
            activeSensors.textContent = Object.keys(this.sensors).length;
        }

        const alertCount = document.getElementById('alertCount');
        if (alertCount) {
            alertCount.textContent = criticalCount;
        }

        // Update board health
        const boardHealth = document.getElementById('boardHealth');
        if (boardHealth) {
            boardHealth.textContent = `${this.systemState.boardHealth}%`;
        }

        // Alarm vignette
        const vignette = document.getElementById('alarmVignette');
        if (vignette) {
            if (criticalCount > 0) {
                vignette.classList.add('active');
            } else {
                vignette.classList.remove('active');
            }
        }

        // Update cockpit gauges
        this.updateGauges();
    }

    updateGauges() {
        const gauge1 = this.gauges.get('gauge1');
        const gauge2 = this.gauges.get('gauge2');
        const gauge3 = this.gauges.get('gauge3');
        const gauge4 = this.gauges.get('gauge4');

        if (gauge1 && this.sensors['temperature']) {
            gauge1.setValue(this.sensors['temperature'].value);
        }
        if (gauge2 && this.sensors['humidity']) {
            gauge2.setValue(this.sensors['humidity'].value);
        }
        if (gauge3 && this.sensors['co']) {
            gauge3.setValue(this.sensors['co'].value);
        }
        if (gauge4 && this.sensors['air-quality']) {
            gauge4.setValue(this.sensors['air-quality'].value);
        }
    }

    updateTimestamp() {
        const timestampEl = document.getElementById('lastUpdate');
        if (timestampEl) {
            const now = new Date();
            timestampEl.textContent = now.toLocaleTimeString('en-US', { hour12: false });
        }

        // Update live indicator pulse
        const liveIndicator = document.querySelector('.live-indicator');
        if (liveIndicator) {
            liveIndicator.classList.add('pulse');
            setTimeout(() => liveIndicator.classList.remove('pulse'), 500);
        }
    }

    updateDashboardFromMQTT(sensorData, anomalySensorIds = []) {
        Object.entries(sensorData).forEach(([sensorId, value]) => {
            if (this.sensors[sensorId]) {
                // Update sensor status
                this.sensors[sensorId].status = anomalySensorIds.includes(sensorId) ? 'critical' : 'normal';

                // Update values
                this.updateSensorHistory(sensorId, parseFloat(value.toFixed(2)));
                this.updateSensorValue(sensorId, value);
                this.updateTrendIndicator(sensorId);
                this.updateStatusBadge(sensorId, this.sensors[sensorId].status);
                this.updateTrendDisplay(sensorId, this.sensors[sensorId].trend);
                this.updateCardStyling(sensorId, this.sensors[sensorId].status);
                this.renderChart(sensorId);

                // Update Digital Twin
                if (this.digitalTwin) {
                    this.digitalTwin.updateSensorStatus(sensorId, this.sensors[sensorId].status, value);
                }
            }
        });

        this.updateSystemStatus();
        this.systemState.lastUpdate = new Date();
    }

    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-icon">${type === 'error' ? '⚠' : type === 'success' ? '✓' : 'ℹ'}</div>
            <div class="toast-message">${message}</div>
        `;

        container.appendChild(toast);

        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }
}

// ============================================================================
// ENERGY FLOW VISUALIZATION
// ============================================================================

class EnergyFlowVisualization {
    constructor(svgElement) {
        this.svg = svgElement;
        this.paths = [];
        this.init();
    }

    init() {
        if (!this.svg) return;

        this.createFlowPaths();
        this.animate();
    }

    createFlowPaths() {
        // Create animated flow lines
        const pathsData = [
            'M 50,20 Q 100,50 150,30 T 250,50',
            'M 50,50 Q 100,80 150,60 T 250,80',
            'M 50,80 Q 100,110 150,90 T 250,110'
        ];

        pathsData.forEach((d, i) => {
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', d);
            path.setAttribute('class', `flow-path flow-path-${i}`);
            path.setAttribute('fill', 'none');
            path.setAttribute('stroke', 'url(#flowGradient)');
            path.setAttribute('stroke-width', '2');
            path.setAttribute('stroke-dasharray', '10,10');
            this.svg.appendChild(path);
            this.paths.push(path);
        });

        // Add gradient definition
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        defs.innerHTML = `
            <linearGradient id="flowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" style="stop-color:#45a29e;stop-opacity:0"/>
                <stop offset="50%" style="stop-color:#66fcf1;stop-opacity:1"/>
                <stop offset="100%" style="stop-color:#45a29e;stop-opacity:0"/>
            </linearGradient>
        `;
        this.svg.insertBefore(defs, this.svg.firstChild);
    }

    animate() {
        let offset = 0;

        const step = () => {
            offset -= 0.5;
            this.paths.forEach((path, i) => {
                path.setAttribute('stroke-dashoffset', offset + i * 5);
            });
            requestAnimationFrame(step);
        };

        step();
    }
}

// ============================================================================
// ACTIVITY CHART
// ============================================================================

class ActivityChart {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.data = this.generateMockData();
        this.render();
    }

    generateMockData() {
        const data = [];
        for (let i = 0; i < 24; i++) {
            data.push({
                hour: i,
                alerts: Math.floor(Math.random() * 10),
                readings: Math.floor(Math.random() * 100) + 50
            });
        }
        return data;
    }

    render() {
        if (!this.container) return;

        const maxAlerts = Math.max(...this.data.map(d => d.alerts));

        let barsHtml = this.data.map(d => {
            const height = (d.alerts / maxAlerts) * 100;
            const alertClass = d.alerts > 7 ? 'critical' : d.alerts > 4 ? 'warning' : 'normal';
            return `
                <div class="activity-bar-wrapper">
                    <div class="activity-bar ${alertClass}" style="height: ${height}%"></div>
                    <span class="activity-hour">${d.hour}h</span>
                </div>
            `;
        }).join('');

        this.container.innerHTML = `
            <div class="activity-bars">${barsHtml}</div>
        `;
    }
}

// ============================================================================
// INITIALIZATION
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
    // Initialize main dashboard
    window.modernFireDashboard = new ModernFireDashboard();

    // Initialize energy flow
    const energySvg = document.getElementById('energyFlow');
    if (energySvg) {
        new EnergyFlowVisualization(energySvg);
    }

    // Initialize activity chart
    new ActivityChart('activityChart');
});

// Handle page visibility for performance
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        console.log('Dashboard paused');
    } else {
        console.log('Dashboard resumed');
    }
});
