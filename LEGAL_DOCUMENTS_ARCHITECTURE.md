# LEGAL_DOCUMENTS_ARCHITECTURE.md

## 1. Objetivo

Implementar un sistema genérico, escalable y auditable para gestionar
documentos legales dentro del SaaS de gestión de estudios de Pilates.

El sistema debe permitir:

-   Gestionar distintos tipos de documentos legales.
-   Versionar su contenido.
-   Publicar una única versión activa por documento.
-   Registrar qué versión aceptó cada cliente.
-   Diferenciar documentos obligatorios y opcionales.
-   Bloquear el acceso a la PWA cuando falte una aceptación obligatoria.
-   Registrar la decisión del usuario respecto de documentos opcionales.
-   Gestionar los documentos desde el Manager.
-   Mantener un histórico inmutable de versiones publicadas y
    aceptaciones.
-   Evitar tener campos específicos como `termsVersion` o
    `privacyPolicyVersion` directamente en `Client`.

La solución debe estar preparada para incorporar nuevos documentos
legales en el futuro sin modificar el modelo de `Client`.

------------------------------------------------------------------------

## 2. Situación actual

Actualmente existen, como mínimo, estos documentos:

1.  Términos y condiciones.
2.  Política de privacidad y protección de datos.
3.  Consentimiento para ofertas, comunicaciones comerciales y similares.

En la PWA:

-   Términos y condiciones: obligatorio.
-   Política de privacidad: obligatorio.
-   Comunicaciones comerciales/ofertas: opcional.

Los dos primeros checkboxes son necesarios para poder completar el
login/acceso a la aplicación.

El consentimiento comercial no debe bloquear el acceso.

En el Manager existe actualmente una sección similar a:

`Configuración de la app`

donde se introduce el texto de los documentos legales y se guarda
mediante una acción tipo `Guardar configuración de la app`.

Este sistema debe evolucionar hacia una gestión real de documentos y
versiones.

------------------------------------------------------------------------

## 3. Decisión arquitectónica principal

NO almacenar las versiones aceptadas directamente en `Client`.

Evitar campos como:

``` text
termsVersion
privacyPolicyVersion
marketingConsentVersion
```

en la entidad `Client`.

En su lugar, crear un modelo genérico basado en:

``` text
LegalDocument
LegalDocumentVersion
LegalDocumentAcceptance
```

La relación conceptual será:

``` text
LegalDocument
    |
    +--- LegalDocumentVersion 1.0
    |
    +--- LegalDocumentVersion 1.1
    |
    +--- LegalDocumentVersion 1.2
              |
              +--- LegalDocumentAcceptance
              |       client = X
              |       accepted = true
              |
              +--- LegalDocumentAcceptance
                      client = Y
                      accepted = true
```

Esto permite añadir documentos futuros sin modificar `Client`.

------------------------------------------------------------------------

# 4. Entidades

## 4.1 LegalDocument

Representa el concepto/tipo de documento legal.

Ejemplos:

-   TERMS_AND_CONDITIONS
-   PRIVACY_POLICY
-   MARKETING_COMMUNICATIONS

Campos recomendados:

``` text
id
type
required
active
createdAt
updatedAt
```

### type

Debe ser un enum o equivalente.

Ejemplo:

``` text
TERMS_AND_CONDITIONS
PRIVACY_POLICY
MARKETING_COMMUNICATIONS
```

Debe evitarse almacenar nombres arbitrarios si el proyecto utiliza enums
para conceptos de dominio.

### required

Indica si el documento requiere aceptación obligatoria.

``` text
true  -> obligatorio
false -> opcional
```

Ejemplo:

``` text
TERMS_AND_CONDITIONS      -> true
PRIVACY_POLICY            -> true
MARKETING_COMMUNICATIONS  -> false
```

Importante: `required` pertenece al documento y no a la aceptación
individual.

### active

Indica si el documento se encuentra habilitado para su uso.

No confundir:

-   `LegalDocument.active`: documento habilitado.
-   `LegalDocumentVersion.status`: estado de una versión.

------------------------------------------------------------------------

# 5. LegalDocumentVersion

Representa una versión concreta e inmutable del contenido legal.

Campos recomendados:

``` text
id
legalDocumentId
version
content
status
publishedAt
createdAt
createdBy
```

### version

Versión legible para humanos.

Ejemplo:

``` text
1.0
1.1
1.2
2.0
```

La primera versión de cada documento será:

``` text
1.0
```

El sistema debe generar automáticamente la siguiente versión.

No depender de que el administrador escriba manualmente el número.

### content

Debe almacenarse el texto del documento.

No es necesario subir un PDF.

El contenido puede almacenarse como texto enriquecido si el
frontend/editor lo requiere, por ejemplo HTML sanitizado o un formato
estructurado definido por el proyecto.

La implementación debe evitar almacenar imágenes/base64
innecesariamente.

### status

Ejemplo:

``` text
DRAFT
PUBLISHED
ARCHIVED
```

No debe existir más de una versión `PUBLISHED` para un mismo
`LegalDocument`.

### Inmutabilidad

Una versión publicada NO debe editarse.

Si se necesita modificar el texto:

``` text
Versión 1.0
    ↓
crear nueva versión
    ↓
Versión 1.1
```

Nunca:

``` text
1.0 publicada
    ↓
editar contenido
```

Esto es fundamental para poder demostrar qué texto fue aceptado por un
usuario en un momento determinado.

------------------------------------------------------------------------

# 6. LegalDocumentAcceptance

Esta es la entidad central para registrar la decisión de cada cliente.

Campos recomendados:

``` text
id
clientId
legalDocumentVersionId
accepted
acceptedAt
ipAddress
userAgent
createdAt
```

### clientId

Identifica al cliente que realizó la acción.

### legalDocumentVersionId

Debe apuntar a una versión concreta.

No guardar únicamente:

``` text
documentType = PRIVACY_POLICY
version = 1.0
```

si existe una FK a `LegalDocumentVersion`.

La relación con la versión concreta proporciona mayor integridad.

### accepted

Booleano:

``` text
true  -> aceptado
false -> rechazado
```

Esto es especialmente importante para documentos opcionales.

Ejemplo:

``` text
MARKETING_COMMUNICATIONS
version 1.0
accepted = false
```

significa que el usuario decidió no aceptar comunicaciones comerciales.

Para documentos obligatorios, la PWA no debe permitir continuar si no
existe una aceptación válida.

### acceptedAt

Fecha/hora en la que se produjo la decisión.

Utilizar un tipo temporal apropiado para el proyecto y almacenar las
fechas de forma consistente.

Preferiblemente UTC en backend/base de datos, convirtiendo a zona
horaria local únicamente en presentación.

### ipAddress

Registrar la IP puede ser útil como evidencia de auditoría.

Debe implementarse teniendo en cuenta las obligaciones de protección de
datos y minimización aplicables al proyecto.

### userAgent

Opcional pero recomendable para auditoría.

Puede ayudar a conocer desde qué navegador/dispositivo se produjo la
acción.

------------------------------------------------------------------------

# 7. Restricciones de base de datos

Recomendaciones:

## LegalDocument

Debe existir como máximo un registro por `type`.

Ejemplo:

``` text
TERMS_AND_CONDITIONS -> 1 registro
PRIVACY_POLICY       -> 1 registro
```

## LegalDocumentVersion

Debe existir una única versión para cada combinación:

``` text
legalDocumentId + version
```

Crear una restricción UNIQUE.

## LegalDocumentVersion publicada

Debe garantizarse que solo existe una versión publicada por documento.

Esto puede implementarse mediante:

-   restricción única parcial, si el motor de base de datos lo soporta;
-   lógica transaccional;
-   o ambas.

## LegalDocumentAcceptance

Debe definirse una política clara sobre duplicados.

Recomendación:

No crear una nueva fila cada vez que el usuario simplemente entra al
login.

Crear un registro cuando realmente exista una acción de
aceptación/rechazo.

Si el usuario acepta una nueva versión, debe quedar registrada esa nueva
aceptación.

Para máxima trazabilidad histórica, NO eliminar las aceptaciones
anteriores.

------------------------------------------------------------------------

# 8. Flujo de publicación desde el Manager

El Manager debe dejar de tratar estos textos como una simple
configuración editable.

Debe comportarse como un pequeño gestor de documentos legales.

## Pantalla recomendada

Por ejemplo:

``` text
Configuración de la app
    |
    +--- Documentos legales
             |
             +--- Términos y condiciones
             +--- Política de privacidad
             +--- Comunicaciones comerciales
```

Al entrar en un documento:

``` text
Documento: Términos y condiciones

Versión activa: 1.0
Estado: Publicada
Fecha de publicación: ...

[Ver versión actual]

[Crear nueva versión]
```

Debajo:

``` text
Histórico

Versión | Estado    | Fecha
1.0     | Publicada | 10/08/2026
```

------------------------------------------------------------------------

# 9. Crear una nueva versión

El administrador selecciona:

``` text
Crear nueva versión
```

El sistema debe:

1.  Obtener la última versión.
2.  Calcular automáticamente la siguiente versión.
3.  Copiar opcionalmente el contenido anterior para facilitar la
    edición.
4.  Permitir editar el nuevo contenido.
5.  Crear una versión `DRAFT`.
6.  Mostrar una vista previa.
7.  Permitir publicar.

Ejemplo:

``` text
Última versión: 1.0

Nueva versión:
1.1
```

El administrador NO debería escribir manualmente `1.1`.

------------------------------------------------------------------------

# 10. Publicar una nueva versión

Al publicar:

``` text
1.0 -> ARCHIVED
1.1 -> PUBLISHED
```

Debe realizarse dentro de una operación transaccional.

No debe existir un momento inconsistente en el que dos versiones
aparezcan como activas.

La publicación debe registrar:

``` text
publishedAt
createdBy / publishedBy
```

si el modelo de seguridad del proyecto permite identificar al
administrador.

------------------------------------------------------------------------

# 11. ¿Qué ocurre con los usuarios que ya aceptaron una versión anterior?

Ejemplo:

``` text
Usuario:
TERMS_AND_CONDITIONS -> 1.0 aceptada

Administrador publica:
TERMS_AND_CONDITIONS -> 1.1
```

En el siguiente acceso de ese usuario:

``` text
Versión activa: 1.1
Versión aceptada: 1.0
```

El sistema detecta:

``` text
1.0 != 1.1
```

Por lo tanto:

``` text
requiere nueva aceptación = true
```

La PWA debe solicitar al usuario que acepte la versión 1.1.

Cuando acepta:

``` text
clientId = X
legalDocumentVersionId = versión 1.1
accepted = true
acceptedAt = ...
```

La aceptación de 1.0 NO debe borrarse.

------------------------------------------------------------------------

# 12. Regla de acceso en la PWA

Antes de permitir el acceso completo a la aplicación, el backend debe
comprobar los documentos obligatorios.

Conceptualmente:

``` text
Para cada LegalDocument obligatorio y activo:

    obtener versión PUBLISHED actual

    comprobar si el cliente aceptó esa versión

    si NO:
        requiere aceptación
```

Si existe al menos un documento obligatorio pendiente:

``` text
LOGIN / AUTENTICACIÓN
        ↓
comprobar obligaciones legales
        ↓
hay documentos pendientes
        ↓
mostrar pantalla de aceptación
        ↓
usuario acepta
        ↓
registrar aceptación
        ↓
permitir acceso
```

------------------------------------------------------------------------

# 13. Documentos opcionales

Ejemplo:

``` text
MARKETING_COMMUNICATIONS
required = false
```

El usuario puede:

``` text
☐ Quiero recibir ofertas y comunicaciones comerciales
```

Puede:

-   aceptar;
-   rechazar;
-   dejarlo sin aceptar.

Ninguna de estas opciones debe impedir el acceso a la PWA.

Si acepta:

``` text
accepted = true
```

Si rechaza explícitamente:

``` text
accepted = false
```

La aplicación debe poder consultar posteriormente el estado actual del
consentimiento.

------------------------------------------------------------------------

# 14. Importante: no mezclar aceptación legal con autenticación

El sistema debe distinguir:

``` text
Autenticación
```

de:

``` text
Aceptación de documentos legales
```

El usuario puede estar correctamente autenticado y aun así tener:

``` text
requiresLegalAcceptance = true
```

El backend debe ser la autoridad final para decidir si el usuario puede
completar el acceso funcional.

No confiar exclusivamente en el frontend.

------------------------------------------------------------------------

# 15. API propuesta

Los nombres exactos deben adaptarse a las convenciones actuales del
proyecto.

## Manager

### Obtener documentos

``` http
GET /api/manager/legal-documents
```

### Obtener detalle

``` http
GET /api/manager/legal-documents/{id}
```

### Crear versión

``` http
POST /api/manager/legal-documents/{id}/versions
```

Ejemplo de body:

``` json
{
  "content": "<contenido del documento>"
}
```

La versión debe calcularla el backend.

### Publicar versión

``` http
POST /api/manager/legal-documents/{id}/versions/{versionId}/publish
```

### Obtener histórico

``` http
GET /api/manager/legal-documents/{id}/versions
```

------------------------------------------------------------------------

# 16. API de la PWA

### Obtener documentos pendientes

Por ejemplo:

``` http
GET /api/legal-documents/pending
```

Respuesta conceptual:

``` json
[
  {
    "documentType": "TERMS_AND_CONDITIONS",
    "version": "1.1",
    "required": true,
    "content": "..."
  },
  {
    "documentType": "PRIVACY_POLICY",
    "version": "1.1",
    "required": true,
    "content": "..."
  }
]
```

El endpoint debe devolver únicamente los documentos que realmente
requieren una acción.

### Registrar aceptación/rechazo

Por ejemplo:

``` http
POST /api/legal-documents/acceptance
```

Body conceptual:

``` json
{
  "legalDocumentVersionId": 15,
  "accepted": true
}
```

El backend debe obtener el cliente autenticado desde el contexto de
seguridad.

NO aceptar `clientId` libremente desde el frontend como fuente de
verdad.

------------------------------------------------------------------------

# 17. Endpoint recomendado para validar acceso

Puede ser útil un endpoint específico:

``` http
GET /api/legal-documents/access-status
```

Respuesta:

``` json
{
  "canAccess": false,
  "requiresAcceptance": true,
  "pendingDocuments": [
    {
      "documentType": "TERMS_AND_CONDITIONS",
      "version": "1.1",
      "required": true
    }
  ]
}
```

Esto permite que la PWA sepa qué debe mostrar.

------------------------------------------------------------------------

# 18. Backend

La implementación debe respetar la arquitectura existente.

No crear lógica de negocio dentro de controllers.

Separar responsabilidades aproximadamente así:

``` text
Controller
    ↓
Service
    ↓
Repository
    ↓
Database
```

El servicio debería encargarse de:

-   obtener documentos activos;
-   obtener versiones publicadas;
-   determinar documentos pendientes;
-   registrar aceptaciones;
-   comprobar si una aceptación corresponde a la versión activa;
-   publicar versiones;
-   generar versiones nuevas.

------------------------------------------------------------------------

# 19. Seguridad

El backend debe validar:

-   que el documento existe;
-   que la versión existe;
-   que la versión pertenece al documento;
-   que el documento está activo;
-   que la versión puede ser aceptada;
-   que el usuario autenticado puede realizar la operación.

No permitir que el frontend determine:

``` text
"Esta es la versión que quiero aceptar"
```

sin validación del backend.

La aceptación debe asociarse al usuario autenticado.

------------------------------------------------------------------------

# 20. Auditoría

Para documentos legales publicados, conservar:

``` text
documento
versión
contenido
fecha de publicación
usuario administrador que publicó
```

Para cada aceptación:

``` text
cliente
documento
versión exacta
accepted
fecha/hora
IP (si se decide conservar)
userAgent (si se decide conservar)
```

Esto permite reconstruir posteriormente:

``` text
¿Qué aceptó el cliente X?
¿Qué versión era?
¿Cuándo la aceptó?
¿Qué texto contenía exactamente esa versión?
```

------------------------------------------------------------------------

# 21. No borrar versiones históricas

Una versión publicada no debería eliminarse físicamente.

Ejemplo:

``` text
1.0 -> ARCHIVED
1.1 -> ARCHIVED
1.2 -> PUBLISHED
```

Las versiones anteriores siguen existiendo.

Esto es necesario para que las aceptaciones históricas continúen
apuntando a contenido real.

------------------------------------------------------------------------

# 22. No editar versiones publicadas

Esta es una regla fundamental.

Incorrecto:

``` text
UPDATE legal_document_version
SET content = 'nuevo contenido'
WHERE id = 10;
```

si esa versión ya fue publicada.

Correcto:

``` text
crear versión 1.1
guardar nuevo contenido
publicar 1.1
```

------------------------------------------------------------------------

# 23. Migración desde el sistema actual

Antes de eliminar el sistema actual, analizar:

-   cómo se almacenan actualmente los términos;
-   cómo se almacena actualmente la política de privacidad;
-   dónde se guardan los checks;
-   qué campos existen en `Client`;
-   qué configuración existe actualmente en `AppConfiguration`.

Crear una migración inicial.

Ejemplo:

``` text
Configuración actual de términos
        ↓
LegalDocument TERMS_AND_CONDITIONS
        ↓
LegalDocumentVersion 1.0
```

Y:

``` text
Configuración actual de privacidad
        ↓
LegalDocument PRIVACY_POLICY
        ↓
LegalDocumentVersion 1.0
```

Para comunicaciones comerciales:

``` text
LegalDocument MARKETING_COMMUNICATIONS
required = false
```

Si existen usuarios que ya aceptaron las condiciones actuales, estudiar
cómo migrar sus aceptaciones a las versiones iniciales `1.0` sin perder
información histórica.

NO borrar datos existentes antes de validar la migración.

------------------------------------------------------------------------

# 24. Modelo conceptual final

``` text
                    ┌─────────────────────┐
                    │    LegalDocument    │
                    ├─────────────────────┤
                    │ id                  │
                    │ type                │
                    │ required            │
                    │ active              │
                    └─────────┬───────────┘
                              │ 1
                              │
                              │ N
                    ┌─────────▼───────────┐
                    │ LegalDocumentVersion│
                    ├─────────────────────┤
                    │ id                  │
                    │ legalDocumentId     │
                    │ version             │
                    │ content             │
                    │ status              │
                    │ publishedAt         │
                    │ createdAt           │
                    │ createdBy           │
                    └─────────┬───────────┘
                              │ 1
                              │
                              │ N
                 ┌────────────▼──────────────┐
                 │ LegalDocumentAcceptance   │
                 ├───────────────────────────┤
                 │ id                        │
                 │ clientId                  │
                 │ legalDocumentVersionId    │
                 │ accepted                  │
                 │ acceptedAt                │
                 │ ipAddress                 │
                 │ userAgent                 │
                 │ createdAt                 │
                 └────────────┬──────────────┘
                              │
                              │ N
                              │
                         ┌────▼────┐
                         │ Client  │
                         └─────────┘
```

------------------------------------------------------------------------

# 25. Reglas funcionales definitivas

La implementación debe respetar estas reglas:

1.  Cada documento legal tiene un tipo único.
2.  Un documento puede tener múltiples versiones.
3.  Solo una versión puede estar publicada/activa por documento.
4.  La primera versión será `1.0`.
5.  Las versiones posteriores deben generarse automáticamente.
6.  Una versión publicada es inmutable.
7.  Para modificar contenido se crea una nueva versión.
8.  Las versiones antiguas no se eliminan.
9.  Cada aceptación apunta a una versión concreta.
10. No guardar las versiones aceptadas directamente en `Client`.
11. Los documentos obligatorios bloquean el acceso si no existe
    aceptación de la versión publicada actual.
12. Los documentos opcionales no bloquean el acceso.
13. Los rechazos explícitos de documentos opcionales deben poder
    registrarse.
14. La aceptación debe asociarse al usuario autenticado en backend.
15. El frontend nunca debe ser la fuente de verdad para determinar si
    una aceptación es válida.
16. Las nuevas versiones deben provocar una nueva aceptación cuando
    corresponda.
17. El histórico debe permitir conocer qué versión exacta aceptó un
    cliente.
18. Los documentos deben gestionarse desde el Manager.
19. El contenido se almacenará como texto, no es obligatorio utilizar
    PDF.
20. La solución debe permitir añadir nuevos tipos de documentos sin
    modificar `Client`.

------------------------------------------------------------------------

# 26. Criterios de aceptación

La implementación se considera correcta cuando:

### Manager

-   [ ] Se pueden visualizar los documentos legales.
-   [ ] Se puede visualizar la versión publicada.
-   [ ] Se puede crear una nueva versión.
-   [ ] La versión se genera automáticamente.
-   [ ] Se puede publicar una nueva versión.
-   [ ] Se puede consultar el histórico.
-   [ ] Las versiones publicadas no se pueden editar.
-   [ ] Se puede visualizar el contenido de versiones antiguas.

### PWA

-   [ ] Los términos y condiciones son obligatorios.
-   [ ] La política de privacidad es obligatoria.
-   [ ] Comunicaciones comerciales es opcional.
-   [ ] Los documentos obligatorios pendientes bloquean el acceso
    funcional.
-   [ ] Los documentos opcionales no bloquean el acceso.
-   [ ] Se puede aceptar/rechazar el consentimiento opcional.
-   [ ] Se muestra al usuario la versión vigente que debe aceptar.

### Backend

-   [ ] Existe `LegalDocument`.
-   [ ] Existe `LegalDocumentVersion`.
-   [ ] Existe `LegalDocumentAcceptance`.
-   [ ] Las relaciones están correctamente definidas.
-   [ ] Se evita guardar versiones legales directamente en `Client`.
-   [ ] Las versiones publicadas son inmutables.
-   [ ] Se mantiene el histórico.
-   [ ] Las operaciones críticas son transaccionales.
-   [ ] El usuario autenticado determina el `clientId`.
-   [ ] Se validan permisos y existencia de documentos/versiones.

------------------------------------------------------------------------

# 27. Consideraciones legales

Este diseño es una especificación técnica y no sustituye asesoramiento
jurídico.

La implementación debe permitir posteriormente adaptar:

-   textos;
-   tipos de consentimiento;
-   información de auditoría;
-   política de conservación;
-   mecanismos de retirada de consentimiento;
-   derechos de los usuarios;
-   tratamiento de datos personales.

Especialmente para datos como IP y User-Agent, revisar con asesoramiento
especializado si su conservación es necesaria, durante cuánto tiempo y
bajo qué base jurídica.

------------------------------------------------------------------------

# 28. Instrucciones para la IA que implemente esta especificación

Antes de modificar código:

1.  Analiza la estructura actual del proyecto.
2.  Identifica backend, frontend Manager y PWA.
3.  Identifica las entidades relacionadas con `Client`.
4.  Identifica cómo se gestionan actualmente los textos legales.
5.  Identifica cómo funciona actualmente el login.
6.  Identifica la autenticación/autorización.
7.  Identifica la base de datos y framework ORM utilizado.
8.  Identifica las convenciones existentes de:
    -   entidades;
    -   DTOs;
    -   repositories;
    -   services;
    -   controllers;
    -   migrations;
    -   tests.
9.  No introduzcas una arquitectura paralela si el proyecto ya tiene
    patrones establecidos.
10. Mantén compatibilidad con la arquitectura existente.

Después:

1.  Diseña las migraciones.
2.  Implementa las entidades.
3.  Implementa repositories.
4.  Implementa services.
5.  Implementa endpoints.
6.  Implementa la lógica de publicación/versionado.
7.  Implementa la comprobación de documentos pendientes.
8.  Integra la comprobación en el flujo de login/acceso existente.
9.  Modifica el Manager para gestionar versiones.
10. Modifica la PWA para mostrar y registrar las aceptaciones.
11. Migra los datos existentes.
12. Añade tests unitarios e integración.
13. Verifica que no se rompa el login existente.
14. Ejecuta las pruebas existentes.
15. Documenta cualquier decisión que difiera de esta especificación.

No realizar cambios destructivos en la base de datos sin una migración
segura y reversible.

------------------------------------------------------------------------

# 29. Resultado esperado

Al finalizar, el SaaS debe tener un sistema de documentos legales
desacoplado de `Client` y preparado para crecer.

Ejemplo final:

``` text
TERMS_AND_CONDITIONS
    required = true
    active = true

    1.0 -> ARCHIVED
    1.1 -> PUBLISHED


PRIVACY_POLICY
    required = true
    active = true

    1.0 -> ARCHIVED
    1.1 -> PUBLISHED


MARKETING_COMMUNICATIONS
    required = false
    active = true

    1.0 -> PUBLISHED
```

Y un cliente podría tener:

``` text
Client #123

TERMS_AND_CONDITIONS
    accepted version: 1.1
    accepted: true

PRIVACY_POLICY
    accepted version: 1.1
    accepted: true

MARKETING_COMMUNICATIONS
    accepted version: 1.0
    accepted: false
```

Sin añadir ningún campo nuevo a `Client`.

El resultado es un sistema genérico de gestión, publicación, versionado
y trazabilidad de documentos legales que puede crecer junto con el SaaS.
