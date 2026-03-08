import axios from 'axios';

const instance = axios.create({
    baseURL: process.env.REACT_APP_API_URL, // 환경에 따라 자동으로 바뀜
});

export default instance;