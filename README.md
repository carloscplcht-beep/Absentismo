# Cuadro de mando de absentismo y cobertura de ausencias

Aplicación web estática para analizar absentismo, sustituciones y coste a partir del Excel `RH_Cobertura_Ausencias.xls` / `.xlsx`.

El procesamiento se realiza íntegramente en el navegador con SheetJS. No hay backend, no se envían datos a servidores externos y los DNI no se muestran por defecto.

## Instalación

```bash
npm install
npm run dev
```

Para generar la versión desplegable:

```bash
npm run build
```

La salida queda en `dist/` y puede publicarse en GitHub Pages. La configuración de Vite usa `base: "./"` para facilitar despliegues en subcarpetas.

## Uso

1. Abra la aplicación.
2. Pulse `Cargar archivo Excel`.
3. Seleccione `RH_Cobertura_Ausencias.xls` o un `.xlsx` equivalente.
4. Use los filtros globales y navegue entre las vistas:
   - Resumen ejecutivo
   - Análisis de absentismo
   - Cobertura y sustitución
   - Costes
   - Categorías profesionales
   - Ámbitos / unidades
   - Detalle de registros
   - Informe imprimible

## Estructura esperada del Excel

La app detecta automáticamente la fila de encabezados. Está preparada para libros donde la primera fila contiene información y los encabezados reales empiezan en la fila 2.

Columnas críticas mínimas:

- ÁMBITO
- CATEGORÍA CENTRALIZADA
- CATEGORÍA NOMBRAMIENTO
- TIPO DE PERSONAL
- AUS. INICIO
- AUS. FIN
- DÍAS AUS.
- DÍAS AUSENCIA HASTA FIN P.
- TIPO DE AUSENCIA
- SUPLENTE
- DÍAS SUSTITUIDOS
- DÍAS SUSTITUIDOS HASTA FIN P.
- TOTAL Nómina Abonada

Si faltan columnas, se muestra un aviso y el dashboard sigue funcionando con los cálculos posibles.

## Cálculos implementados

- Registros totales.
- Ausencias únicas.
- Personas ausentes únicas.
- Personas suplentes únicas.
- Días de ausencia y días hasta fin de periodo.
- Días sustituidos y días sustituidos hasta fin de periodo.
- Días no sustituidos.
- Porcentaje de sustitución por días.
- Ausencias con y sin suplente.
- Porcentaje de ausencias con suplente.
- Bruto de nómina abonada, cuota patronal y total.
- Costes medios por día sustituido, día de ausencia, ausencia y ausencia cubierta.
- Ausencias abiertas y porcentaje de ausencias abiertas.
- Ranking de impacto gestor.

Fórmula de impacto gestor:

```text
35% días de ausencia + 35% días no sustituidos + 20% coste total + 10% baja cobertura
```

## Privacidad

La aplicación está diseñada para uso local:

- No usa backend.
- No llama a APIs externas.
- No sube archivos.
- No muestra DNI ni DNI de suplente por defecto.
- La tabla de detalle incluye un interruptor explícito para mostrar datos identificativos.

## Validación local

Puede auditar la lectura del Excel real con:

```bash
npm run validate:excel -- "C:\Users\carlo\Downloads\RH_Cobertura_Ausencias.xls"
```

Este comando imprime la hoja detectada, la fila de encabezados, columnas críticas ausentes y métricas principales.

## Nota técnica

`xlsx` permite leer `.xls` y `.xlsx` en navegador, pero puede aparecer una advertencia de seguridad en `npm audit` asociada a la dependencia. Se mantiene por compatibilidad con el requisito funcional de lectura local de Excel en formato antiguo.
