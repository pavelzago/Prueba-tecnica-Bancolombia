## Gerencia de Evolución Contable y Tributaria Prueba técnica – Analista III

## Propósito de la prueba

Evaluar la capacidad del candidato para comprender una necesidad contable y tributaria, transformar reglas de negocio en una solución tecnológica y construir un prototipo funcional con Angular en el frontend y Python en el backend. Se valorarán la claridad del análisis, la calidad del código, la trazabilidad de los cálculos, la experiencia de usuario y la comunicación de resultados.

## Caso de negocio: conciliador de facturas y retenciones

La Gerencia de Evolución Contable y Tributaria recibe mensualmente un archivo con facturas de proveedores y otro con los registros contabilizados. Actualmente, un analista cruza ambos archivos de forma manual para identificar diferencias en valores, impuestos, retenciones y estados de contabilización. El proceso consume tiempo, dificulta la trazabilidad y puede generar reprocesos. El candidato deberá desarrollar un prototipo que cargue la información, aplique reglas básicas de validación y presente las inconsistencias para su gestión.

Resultado esperado: un prototipo web que permita cargar los dos archivos, procesar las reglas definidas y consultar un resumen y un detalle de las facturas correctas y de aquellas que presentan inconsistencias.

## Datos de entrada

| Archivo | Campos mínimos |
| --- | --- |
| facturas.csv | id_factura, nit_proveedor, fecha_factura, concepto, base_gravable, tarifa_iva, valor_iva, tarifa_retencion, valor_retencion, total_factura |
| contabilidad.csv | id_factura, fecha_contabilizacion, cuenta_contable, centro_costo, valor_debito, valor_credito, estado |

La empresa entregará dos archivos de ejemplo con entre 40 y 60 registros. Los datos serán ficticios e incluirán casos correctos, duplicados, campos vacíos, facturas sin contabilizar y diferencias de cálculo. El candidato no debe requerir acceso a sistemas corporativos ni utilizar información real de clientes o proveedores.

## Reglas mínimas de negocio

- 1. Calcular el IVA esperado como base gravable × tarifa de IVA.

- 2. Validar el total de la factura como base gravable + IVA − retención.

- 3. Identificar facturas duplicadas y facturas sin registro contable.

- 4. Clasificar cada factura como Correcta o Con inconsistencia e indicar la causa.


- 5. Presentar un resumen con la cantidad total de facturas y el número de inconsistencias.

## Reto técnico

## Backend en Python

- Construir una API REST básica con Python, usando FastAPI, Flask o una alternativa similar.

- Recibir los archivos CSV y leer su información.

- Aplicar las reglas mínimas de negocio.

- Exponer un servicio que entregue el resumen y el detalle de los resultados.

- Manejar de forma básica errores de archivo o campos obligatorios.

## Frontend en Angular

- Crear una pantalla para cargar los archivos y ejecutar el procesamiento.

- Mostrar un resumen con el total de facturas y las inconsistencias encontradas.

- Presentar una tabla con los resultados y permitir filtrar por estado.

- Consumir la API de Python desde Angular.

- Mostrar mensajes básicos de carga y error.

## Entregables

- 1. Código fuente del frontend y del backend en un repositorio o archivo comprimido.

- 2. README con las instrucciones completas para instalar y ejecutar la solución, incluyendo versiones, dependencias, comandos requeridos y cualquier configuración necesaria.

- 3. Archivos de prueba utilizados.

- 4. Presentación ejecutiva de máximo cinco diapositivas, diseñada para exponer la propuesta del prototipo ante el equipo funcional. Debe explicar de manera clara el problema, la solución propuesta, el flujo general, los principales resultados y los beneficios esperados, evitando un nivel de detalle excesivamente técnico.

- 5. Declaración sobre el uso de inteligencia artificial generativa. Si fue utilizada, se debe indicar específicamente en qué partes de la solución se empleó y con qué propósito. Si no fue utilizada, también deberá indicarse.

## Condiciones de desarrollo y entrega

La entrega debe ser reproducible: el evaluador debe poder instalar las dependencias, iniciar el backend y el frontend, cargar los archivos de prueba y obtener los resultados esperados siguiendo únicamente las instrucciones incluidas en el README.

- Tiempo de referencia para el desarrollo: entre 4 y 5 horas efectivas.

- La solución debe ejecutarse con herramientas y dependencias de libre acceso o claramente identificadas.


- No se espera una solución con características de producción; se prioriza el funcionamiento del flujo principal y la comprensión de los fundamentos.

- Los supuestos, decisiones técnicas y funcionalidades no completadas deben quedar documentados en el README.

- No se debe incluir información real, credenciales ni datos sensibles en el código o en los archivos entregados.

## Criterios de evaluación

| Criterio |   | Ponderación Aspectos evaluados |
| --- | --- | --- |
| Comprensión contable y tributaria | 20% | Comprensión del caso de negocio; cálculo correcto del IVA y del total de la factura; identificación de duplicados y facturas sin registro contable; clasificación y explicación clara de las inconsistencias. |
| Backend en Python | 25% | Creación y funcionamiento de la API REST; lectura de archivos CSV; aplicación de las reglas de negocio; estructura de la respuesta; manejo básico de archivos inválidos, datos faltantes y errores. |
| Frontend en Angular | 25% | Carga de archivos; consumo del servicio de Python; visualización del resumen y del detalle; filtro por estado; mensajes de carga y error; organización básica de componentes y claridad de la interfaz. |
| Integración full stack | 20% | Comunicación correcta entre Angular y Python; envío y procesamiento de archivos; correspondencia entre los datos procesados y los resultados mostrados; funcionamiento completo del flujo principal. |
| Claridad, documentación y comunicación | 10% | Código legible y organizado; README con versiones, dependencias, configuración y pasos reproducibles; identificación de funcionalidades incompletas; declaración específica del uso de inteligencia artificial generativa; presentación clara del prototipo para un equipo funcional. |
