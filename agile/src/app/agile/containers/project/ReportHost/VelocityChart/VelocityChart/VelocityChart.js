import React, { Component } from 'react';
import { observer } from 'mobx-react';
import ReactEcharts from 'echarts-for-react';
import _ from 'lodash';
import {
  Page, Header, Content, stores,
} from 'choerodon-front-boot';
import { trace } from 'mobx';
import {
  Button, Table, Select, Icon, Spin,
} from 'choerodon-ui';
// import pic from './no_sprint.svg';
import pic from '../../../../../assets/image/emptyChart.svg';
import SwithChart from '../../Component/switchChart';
import VS from '../../../../../stores/project/velocityChart';
import EmptyBlock from '../../../../../components/EmptyBlock';
import './VelocityChart.scss';

const { AppState } = stores;
const { Option } = Select;
let backUrl;

@observer
class VelocityChart extends Component {
  constructor(props) {
    super(props);
    this.state = {
      linkFromParamUrl: undefined,
    };
  }

  componentDidMount() {
    const { location: { search } } = this.props;
    const linkFromParamUrl = _.last(search.split('&')).split('=')[0] === 'paramUrl' ? _.last(search.split('&')).split('=')[1] : undefined;
    this.setState({
      linkFromParamUrl,
    });
    VS.setCurrentUnit('story_point');
    VS.loadChartAndTableData();
  }

  componentWillUnmount() {
    VS.setChartData([]);
    VS.setTableData([]);
  }

  GetRequest(url) {
    const theRequest = {};
    if (url.indexOf('?') !== -1) {
      const str = url.split('?')[1];
      const strs = str.split('&');
      for (let i = 0; i < strs.length; i += 1) {
        theRequest[strs[i].split('=')[0]] = decodeURI(strs[i].split('=')[1]);
      }
    }
    return theRequest;
  }

  getOption() {
    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow',
        },
      },
      legend: {
        orient: 'horizontal',
        x: 'right',
        y: 0,
        padding: [0, 50, 0, 0],
        itemWidth: 14,
        data: [
          {
            name: '预估',
            icon: 'rectangle',
          },
          {
            name: '已完成',
            icon: 'rectangle',
          },
        ],
      },
      grid: {
        y2: 10,
        top: '30',
        left: 0,
        right: '50',
        containLabel: true,
      },
      calculable: true,
      xAxis: {
        name: '冲刺',
        type: 'category',
        boundaryGap: true,
        nameGap: -10,
        nameLocation: 'end',
        nameTextStyle: {
          color: '#000',
          padding: [35, 0, 0, 0],
        },
        axisTick: { show: false },
        axisLine: {
          show: true,
          lineStyle: {
            color: '#eee',
            type: 'solid',
            width: 2,
          },
        },
        axisLabel: {
          show: true,
          interval: 0,
          margin: 13,
          textStyle: {
            color: 'rgba(0, 0, 0, 0.65)',
            fontSize: 12,
            fontStyle: 'normal',
          },
          formatter(value, index) {
            if (value.length > 10) {
              return `${value.slice(0, 10)}...`;
            } else {
              return value;
            }
          },
        },
        splitLine: {
          show: false,
          onGap: false,
          interval: 0,
          lineStyle: {
            color: ['#eee'],
            width: 1,
            type: 'solid',
          },
        },
        data: VS.getChartDataX,
      },
      yAxis: {
        name: VS.getChartYAxisName,
        type: 'value',

        nameTextStyle: {
          color: '#000',
        },
        axisTick: { show: false },
        axisLine: {
          show: true,
          lineStyle: {
            color: '#eee',
            type: 'solid',
            width: 2,
          },
        },

        axisLabel: {
          show: true,
          interval: 'auto',
          margin: 18,
          textStyle: {
            color: 'rgba(0, 0, 0, 0.65)',
            fontSize: 12,
            fontStyle: 'normal',
          },
        },
        splitLine: {
          show: true,
          lineStyle: {
            color: '#eee',
            type: 'solid',
            width: 1,
          },
        },
      },
      series: [
        {
          name: '预估',
          type: 'bar',
          barWidth: 34,
          barGap: '12%',
          itemStyle: {
            color: '#d3d3d3',
          },
          data: VS.getChartDataYCommitted,
          emphasis: {
            itemStyle: {
              color: '#e0e0e0',
            },
          },
        },
        {
          name: '已完成',
          type: 'bar',
          barWidth: 34,
          data: VS.getChartDataYCompleted,
          itemStyle: {
            color: '#00bfa5',
          },
          lineStyle: {
            type: 'dashed',
            color: 'grey',
          },
          emphasis: {
            itemStyle: {
              color: '#35e6ce',
            },
          },
        },
      ],
    };
  }

  getTableValue(record, type) {
    const currentUnit = VS.beforeCurrentUnit;
    const CAMEL = {
      story_point: 'StoryPoints',
      remain_time: 'RemainTime',
      issue_count: 'IssueCount',
    };
    const currentProp = `${type}${CAMEL[currentUnit]}`;
    if (currentUnit === 'remain_time') {
      return this.transformRemainTime(record[currentProp]);
    }
    return record[currentProp] || 0;
  }

  refresh() {
    VS.loadChartAndTableData();
  }

  handleChangeCurrentUnit(unit) {
    VS.setCurrentUnit(unit);
    VS.loadChartData(unit);
  }

  transformRemainTime(remainTime, type) {
    if (!remainTime) {
      return '0';
    }
    let time = remainTime * 1;
    const w = Math.floor(time / 40);
    time -= 40 * w;
    const d = Math.floor(time / 8);
    time -= 8 * d;
    return `${w ? `${w}周 ` : ''}${d ? `${d}天 ` : ''}${time ? `${time}小时 ` : ''}`;
  }

  renderTable() {
    const column = [
      {
        width: '33%',
        title: '冲刺',
        dataIndex: 'sprintName',
        render: (sprintName, record) => (
          <span
            style={{
              color: '#3f51b5',
              cursor: 'pointer',
            }}
            role="none"
            onClick={() => {
              const { history } = this.props;
              const urlParams = AppState.currentMenuType;
              history.push(
                `/agile/issue?type=${urlParams.type}&id=${urlParams.id}&name=${
                  encodeURIComponent(urlParams.name)
                }&organizationId=${urlParams.organizationId}&paramType=sprint&paramId=${
                  record.sprintId
                }&paramName=${sprintName}下的问题&paramUrl=reporthost/velocityChart`,
              );
            }}
          >
            {sprintName}
          </span>
        ),
      },
      {
        width: '33%',
        title: '预估',
        dataIndex: 'committedRemainTime',
        render: (committedRemainTime, record) => (
          <span>
            {/* {this.transformRemainTime(committedRemainTime)} */}
            {this.getTableValue(record, 'committed')}
          </span>
        ),
      },
      {
        width: '33%',
        title: '已完成',
        dataIndex: 'completedRemainTime',
        render: (completedRemainTime, record) => (
          <span>
            {/* {this.transformRemainTime(completedRemainTime)} */}
            {this.getTableValue(record, 'completed')}
          </span>
        ),
      },
    ];
    return (
      <Table
        rowKey={record => record.sprintId}
        dataSource={VS.chartData}
        columns={column}
        filterBar={false}
        pagination={false}
        scroll={{ x: true }}
        loading={VS.tableLoading}
      />
    );
  }

  render() {
    const { history } = this.props;
    const { linkFromParamUrl } = this.state;
    const urlParams = AppState.currentMenuType;
    return (
      <Page className="c7n-velocity">
        <Header
          title="迭代速度图"
          backPath={`/agile/${linkFromParamUrl || 'reporthost'}?type=${urlParams.type}&id=${urlParams.id}&name=${
            encodeURIComponent(urlParams.name)
          }&organizationId=${urlParams.organizationId}`}
        >
          <SwithChart history={this.props.history} current="velocityChart" />
          <Button funcType="flat" onClick={this.refresh.bind(this)}>
            <Icon type="refresh icon" />
            <span>刷新</span>
          </Button>
        </Header>
        <Content
          title="迭代速度图"
          description="跟踪各个迭代已完成的工时量。这有助于您确定团队的开发速度并预估在未来迭代中能完成的工作量。"
          link="http://v0-10.choerodon.io/zh/docs/user-guide/agile/report/iterative-chart/"
        >
          {!(!VS.chartLoading && !VS.getChartDataX.length) ? (
            <div>
              <Select
                style={{ width: 512 }}
                label="单位选择"
                value={VS.currentUnit}
                onChange={this.handleChangeCurrentUnit.bind(this)}
              >
                <Option key="story_point" value="story_point">
                  {'故事点'}
                </Option>
                <Option key="issue_count" value="issue_count">
                  {'问题计数'}
                </Option>
                <Option key="remain_time" value="remain_time">
                  {'剩余时间'}
                </Option>
              </Select>
              <Spin spinning={VS.chartLoading}>
                <ReactEcharts className="c7n-chart" option={this.getOption()} />
              </Spin>
              {this.renderTable()}
            </div>
          ) : (
            <EmptyBlock
              style={{ marginTop: 40 }}
              textWidth="auto"
              pic={pic}
              title="当前项目无可用冲刺"
              des={(
                <div>
                  <span>请在</span>
                  <span
                    style={{ color: '#3f51b5', margin: '0 5px', cursor: 'pointer' }}
                    role="none"
                    onClick={() => {
                      history.push(
                        `/agile/backlog?type=${urlParams.type}&id=${urlParams.id}&name=${
                          encodeURIComponent(urlParams.name)
                        }&organizationId=${urlParams.organizationId}`,
                      );
                    }}
                  >
                    待办事项
                  </span>
                  <span>中创建一个冲刺</span>
                </div>
)}
            />
          )}
        </Content>
      </Page>
    );
  }
}

export default VelocityChart;
