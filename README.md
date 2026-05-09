# Cuadro de mando de absentismo y cobertura de ausencias

Version 1.5.0 de la aplicacion web estatica para analizar absentismo, sustituciones, cobertura y coste a partir del Excel `RH_Cobertura_Ausencias.xls` / `.xlsx`.

El procesamiento se realiza integramente en el navegador con SheetJS. No hay backend, no se envian datos a servidores externos y los DNI no se muestran por defecto.

## Novedades v1.5.0

- Nueva pagina **Inteligencia gestora**.
- Tendencias mensuales de absentismo, coste y cobertura.
- Prevision orientativa de cierre anual.
- Motor local de alertas gestoras.
- Indice de impacto gestor explicable.
- Analisis especifico de ausencia no cubierta.
- Simulador de escenarios.
- Recomendaciones automaticas basadas en reglas.
- Integracion de los hallazgos inteligentes en el informe imprimible.

## Instalacion

```bash
npm install
npm run dev
```

Para generar la version desplegable:

```bash
npm run build
```

La salida queda en `dist/`. Vite esta configurado con `base: "./"` para GitHub Pages en subcarpeta.

## Uso

1. Abra la aplicacion.
2. Pulse `Cargar archivo Excel`.
3. Seleccione `RH_Cobertura_Ausencias.xls` o un `.xlsx` equivalente.
4. Use filtros globales y navegue entre:
   - Resumen ejecutivo
   - Inteligencia gestora
   - Analisis de absentismo
   - Cobertura y sustitucion
   - Costes
   - Categorias profesionales
   - Ambitos / unidades
   - Detalle de registros
   - Informe imprimible

## Estructura esperada del Excel

La app detecta automaticamente la fila de encabezados. Esta preparada para libros donde la primera fila contiene informacion y los encabezados reales empiezan en la fila 2.

Columnas criticas minimas:

- AMBITO
- CATEGORIA CENTRALIZADA
- CATEGORIA NOMBRAMIENTO
- TIPO DE PERSONAL
- AUS. INICIO
- AUS. FIN
- DIAS AUS.
- DIAS AUSENCIA HASTA FIN P.
- TIPO DE AUSENCIA
- SUPLENTE
- DIAS SUSTITUIDOS
- DIAS SUSTITUIDOS HASTA FIN P.
- TOTAL Nomina Abonada

Si faltan columnas, se muestra un aviso y el dashboard sigue funcionando con los calculos posibles.

## Metodologia de tendencia

La serie mensual usa `AUS. INICIO` como fecha principal. Si no existe o no se puede interpretar, recurre a `AUS. FIN`, `AÑO` o `PERIODO CONTEMPLADO`.

Indicador de tendencia:

- Ascendente: media de los ultimos 3 meses > 10% sobre los 3 meses anteriores.
- Descendente: media de los ultimos 3 meses < -10% frente a los 3 meses anteriores.
- Estable: variacion entre -10% y +10%.
- No calculable: menos de 6 meses con datos.

La media movil de 3 meses solo se muestra con al menos 4 meses disponibles.

## Metodologia de prevision anual

La prevision de cierre anual es una estimacion gestora orientativa basada en los datos cargados:

- **Proyeccion lineal simple**: acumulado actual / meses con datos * 12.
- **Tendencia reciente**: con al menos 6 meses, ajusta la proyeccion lineal por la variacion de los ultimos 3 meses frente a los 3 anteriores. El ajuste se capa entre -20% y +20%.
- **Estacionalidad historica**: con mas de un ano y 18+ meses, estima meses restantes con patron mensual historico. Si faltan meses comparables, vuelve al metodo alternativo.

Calidad:

- Alta: historico suficiente y 18+ meses.
- Media: al menos 6 meses.
- Baja: menos de 6 meses.

## Reglas de alertas

El motor local genera alertas de alta prioridad, prioridad media e informativas. Reglas principales:

- Baja cobertura global: cobertura <50% y mas de 100 dias de ausencia.
- Baja cobertura por categoria: cobertura <50% y mas de 50 dias.
- Concentracion de coste: categoria con >20% del coste total.
- Concentracion de dias no sustituidos: categoria con >20% de dias no sustituidos.
- Coste por dia sustituido elevado: >25% sobre la media y al menos 10 dias sustituidos.
- Tendencia ascendente de ausencia: ultimos 3 meses >15% frente a los 3 anteriores.
- Incremento de coste: ultimos 3 meses >15% frente a los 3 anteriores.
- Concentracion top 3: top 3 >50% de dias o coste.
- Datos incompletos: avisos de columnas o historico insuficiente.
- Ausencias abiertas: >10% del total con volumen suficiente.

## Indice de impacto gestor

Formula v1.5.0:

```text
35% dias de ausencia normalizados +
25% dias no sustituidos normalizados +
25% coste total normalizado +
15% penalizacion por baja cobertura
```

Cada variable se normaliza de 0 a 100 respecto al maximo observado en el conjunto filtrado. La penalizacion por baja cobertura es `100 - % cobertura`.

El indice es una herramienta de priorizacion. No sustituye la valoracion profesional ni implica causalidad.

## Simulador de escenarios

Permite ajustar:

- mejora de cobertura,
- reduccion de dias de ausencia,
- variacion del coste medio por dia sustituido.

Muestra dias sustituidos, dias no sustituidos, nueva cobertura estimada, coste total estimado, coste teorico adicional y diferencia frente a la prevision. Los escenarios son hipoteticos y no modifican datos reales.

## Privacidad

- Sin backend.
- Sin APIs externas.
- Sin envio de datos.
- Sin almacenamiento remoto.
- Procesamiento local en navegador.
- DNI y DNI de suplente ocultos por defecto.

## Despliegue en GitHub Pages

```bash
npm run build
```

Publicar el contenido de `dist/` en la rama `gh-pages` y configurar Pages con:

- Branch: `gh-pages`
- Folder: `/`

URL actual del despliegue:

```text
https://carloscplcht-beep.github.io/Absentismo/
```

## Validacion local

Auditoria de lectura del Excel real:

```bash
npm run validate:excel -- "C:\Users\carlo\Downloads\RH_Cobertura_Ausencias.xls"
```

El comando informa de hoja detectada, fila de encabezados, columnas criticas, registros normalizados y metricas principales.

## Nota tecnica

`xlsx` permite leer `.xls` y `.xlsx` localmente en navegador. Puede aparecer una advertencia de seguridad en `npm audit` asociada a esa dependencia; se mantiene por compatibilidad con lectura local de Excel antiguo.
