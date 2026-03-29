# 🔗 Blockchain Node — Express

Nodo Express para la red blockchain distribuida de Grados Académicos.

---

## 🚀 Instalación

```bash
npm install
cp .env.example .env
# Edita .env con tus credenciales de Supabase
```

## ▶️ Ejecutar

```bash
# Desarrollo (con hot reload)
npm run dev

# Producción
npm start
```

El nodo corre por defecto en **http://localhost:8003**  
Swagger UI disponible en **http://localhost:8003/api-docs**

---

## 🗄️ Supabase — SQL a ejecutar

Corre esto en el SQL Editor de tu proyecto Supabase:

```sql
CREATE TABLE personas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(100) NOT NULL,
  apellido_paterno VARCHAR(100) NOT NULL,
  apellido_materno VARCHAR(100),
  curp VARCHAR(18) UNIQUE,
  correo VARCHAR(150),
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE instituciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(255) NOT NULL,
  pais VARCHAR(100),
  estado VARCHAR(100),
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE niveles_grado (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL
);

INSERT INTO niveles_grado (nombre) VALUES
('Técnico'), ('Licenciatura'), ('Maestría'), ('Doctorado'), ('Especialidad');

CREATE TABLE programas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(255) NOT NULL,
  nivel_grado_id INT REFERENCES niveles_grado(id),
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE grados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  persona_id UUID REFERENCES personas(id) ON DELETE CASCADE,
  institucion_id UUID REFERENCES instituciones(id),
  programa_id UUID REFERENCES programas(id),
  fecha_inicio DATE,
  fecha_fin DATE,
  titulo_obtenido VARCHAR(255),
  numero_cedula VARCHAR(50),
  titulo_tesis TEXT,
  menciones VARCHAR(100),
  hash_actual TEXT NOT NULL,
  hash_anterior TEXT,
  nonce INTEGER,
  firmado_por VARCHAR(255),
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 📡 Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/health` | Estado del nodo |
| GET | `/chain` | Cadena completa |
| POST | `/transactions` | Crear transacción |
| GET | `/transactions/pending` | Ver transacciones pendientes |
| POST | `/mine` | Minar bloque |
| POST | `/nodes/register` | Registrar nodos |
| GET | `/nodes` | Ver nodos registrados |
| GET | `/nodes/resolve` | Consenso (cadena más larga) |
| POST | `/blocks/receive` | Recibir bloque externo |

---

## 🧪 Flujo de prueba rápida

### 1. Insertar datos en Supabase primero
```sql
INSERT INTO personas (nombre, apellido_paterno) VALUES ('Juan', 'García');
INSERT INTO instituciones (nombre, pais) VALUES ('ITESM', 'México');
INSERT INTO programas (nombre, nivel_grado_id) VALUES ('Ing. Sistemas', 2);
```

### 2. Crear una transacción
```bash
curl -X POST http://localhost:8003/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "persona_id": "UUID_DE_JUAN",
    "institucion_id": "UUID_DEL_ITESM",
    "programa_id": "UUID_DEL_PROGRAMA",
    "titulo_obtenido": "Ingeniero en Sistemas",
    "fecha_fin": "2024-06-01"
  }'
```

### 3. Minar
```bash
curl -X POST http://localhost:8003/mine
```

### 4. Registrar nodos del equipo
```bash
curl -X POST http://localhost:8003/nodes/register \
  -H "Content-Type: application/json" \
  -d '{ "nodes": ["http://localhost:8001", "http://localhost:8002"] }'
```

### 5. Consenso
```bash
curl http://localhost:8003/nodes/resolve
```
