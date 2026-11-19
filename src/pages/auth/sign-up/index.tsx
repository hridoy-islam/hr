import { Link } from 'react-router-dom';
import { SignUpForm } from './components/sign-up-form';
import AuthLayout from '../components/auth-layout';
import signIn from '../../../assets/imges/home/signIn.png';

export default function SignUpPage() {
  return (
    <AuthLayout
      title="Create Account"
      description={
        <>
          Already have an account?{' '}
          <Link to="/" className="text-supperagent hover:underline">
            Sign In
          </Link>
        </>
      }
      image={signIn}
      imageAlt="Desk illustration"
      heading="Get started with your HR workspace."
    >
      <div className="space-y-6">
        <SignUpForm />
        <p className="text-center text-sm text-gray-600">
          By creating an account, you agree to our{' '}
          <span className="font-medium text-supperagent">Terms and Conditions</span>{' '}
          &{' '}
          <span className="font-medium text-supperagent">Privacy Policy</span>
        </p>
      </div>
    </AuthLayout>
  );
}
