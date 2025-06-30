import { notification } from 'antd';
import { InfoCircleOutlined } from "@ant-design/icons";

export const showNotification = ({ message, description, type}) => {
    notification.open({
      message: <p className='inter-14 blanco !font-extrabold'>{message}</p>,
      description: <p className='inter-12 blanco'>{description}</p>,
      icon: <InfoCircleOutlined style={{ color: "#fff" }} />,
      style: {
        backgroundColor: "#000",
        color: "#fff",
        border: "1px solid #4D4D4D",
        borderRadius: "5px"
      },
      duration: 5
    });
  };