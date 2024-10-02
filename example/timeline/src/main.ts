/* eslint-disable simple-import-sort/imports */
import {
    ChartColumn,
    ChartConfig,
    ChartModel,
    DataPointsArray,
    Query,
    getChartContext,
} from '@thoughtspot/ts-chart-sdk';
import Highcharts from 'highcharts';
import 'highcharts/es-modules/masters/modules/timeline.src';
import _ from 'lodash';

// Function to get data from specific column dynamically
function getDataForColumn(column: ChartColumn, dataArr: DataPointsArray) {
    const idx = _.findIndex(dataArr.columns, (colId) => column.id === colId);
    return _.map(dataArr.dataValue, (row) => row[idx]);
}

const getDataModel = (chartModel: ChartModel) => {
    const columns = chartModel.columns;
    const dataArr: DataPointsArray = chartModel.data[0].data;

    // Generate points dynamically using the selected columns (category, date, etc.)
    const points = dataArr.dataValue.map((row: any[], idx: number) => {
        return {
            name: row[1], // Category
            x: new Date(row[0]).getTime(), // Date
        };
    });

    return points;
};

const renderChart = (ctx: any) => {
    const chartModel = ctx.getChartModel();
    console.log('chartModel:', chartModel);
    console.log('data:', chartModel.data);

    const dataModel = getDataModel(chartModel);

    console.log('dataModel:', dataModel);

    // Rendering the Timeline chart using Highcharts
    Highcharts.chart('container', {
        chart: {
            type: 'timeline',
        },
        title: {
            text: 'Dynamic Timeline Chart',
            align: 'left',
        },
        accessibility: {
            point: {
                descriptionFormat:
                    '{yCategory}. Start {x:%Y-%m-%d}.',
            },
        },
        series: [
            {
                data: dataModel,
            },
        ],
    });
    return Promise.resolve();
};

const init = async () => {
    const ctx = await getChartContext({
        getDefaultChartConfig: (chartModel: ChartModel): ChartConfig[] => {
            const columns = chartModel.columns;

            // Ensure at least two columns (date and category) are selected
            if (columns.length < 2) {
                return [];
            }

            const chartConfig: ChartConfig = {
                key: 'default',
                dimensions: [
                    {
                        key: 'date',
                        columns: [columns[0]], // Date column
                    },
                    {
                        key: 'category',
                        columns: [columns[1]], // Category column
                    },
                ],
            };
            return [chartConfig];
        },
        getQueriesFromChartConfig: (
            chartConfig: ChartConfig[],
        ): Array<Query> => {
            // Map the selected columns dynamically to the query
            return chartConfig.map(
                (config: ChartConfig): Query =>
                    _.reduce(
                        config.dimensions,
                        (acc: Query, dimension) => ({
                            queryColumns: [
                                ...acc.queryColumns,
                                ...dimension.columns,
                            ],
                        }),
                        {
                            queryColumns: [],
                        } as Query,
                    ),
            );
        },
        renderChart: (context) => renderChart(context),
    });

    await renderChart(ctx);
};

init();
