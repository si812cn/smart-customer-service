import React, { useState, useEffect } from 'react';
import { Layout, Card, Table, Input, Button, Select, message } from 'antd';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const { Header, Content, Sider } = Layout;
const { Search } = Input;
const { Option } = Select;

interface CommentData {
    user: string;
    msg: string;
    platform: string;
    time: number;
}

const App: React.FC = () => {
    const [comments, setComments] = useState<CommentData[]>([]);
    const [loading, setLoading] = useState(false);
    const [platform, setPlatform] = useState<string>('all');

    useEffect(() => {
        fetchComments();
    }, []);

    const fetchComments = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/v1/data/comments');
            const data = await res.json();
            setComments(data);
        } catch (err) {
            message.error('加载失败');
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        { title: '用户', dataIndex: 'user', key: 'user' },
        { title: '消息', dataIndex: 'msg', key: 'msg' },
        { title: '平台', dataIndex: 'platform', key: 'platform' },
        { title: '时间', dataIndex: 'time', key: 'time', render: (t: number) => new Date(t).toLocaleString() }
    ];

    const chartData = [
        { name: '抖音', count: 120 },
        { name: '快手', count: 80 },
        { name: '小红书', count: 60 },
        { name: '淘宝', count: 100 }
    ];

    return (
        <Layout style={{ height: '100vh' }}>
            <Header style={{ color: 'white', fontSize: '18px' }}>智能客服数据看板</Header>
            <Layout>
                <Sider width={300}>
                    <Card title="实时监控" style={{ margin: 16 }}>
                        <Search placeholder="搜索评论" onSearch={fetchComments} enterButton />
                        <Select
                            value={platform}
                            onChange={setPlatform}
                            style={{ width: '100%', marginTop: 16 }}
                        >
                            <Option value="all">全部平台</Option>
                            <Option value="douyin">抖音</Option>
                            <Option value="kuaishou">快手</Option>
                            <Option value="xiaohongshu">小红书</Option>
                        </Select>
                        <Button type="primary" onClick={fetchComments} style={{ width: '100%', marginTop: 16 }}>
                            刷新数据
                        </Button>
                    </Card>
                </Sider>
                <Layout>
                    <Content style={{ padding: 16 }}>
                        <Card title="评论数据" style={{ marginBottom: 16 }}>
                            <Table
                                dataSource={comments}
                                columns={columns}
                                loading={loading}
                                pagination={{ pageSize: 10 }}
                            />
                        </Card>
                        <Card title="平台分布">
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="count" fill="#1890ff" />
                                </BarChart>
                            </ResponsiveContainer>
                        </Card>
                    </Content>
                </Layout>
            </Layout>
        </Layout>
    );
};

export default App;