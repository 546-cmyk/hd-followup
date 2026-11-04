import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
        <p className="text-muted-foreground mb-6">页面不存在</p>
        <Link to="/login" className="text-primary hover:underline">
          返回首页
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
