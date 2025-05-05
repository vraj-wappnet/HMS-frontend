import React, { useEffect, useState } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState } from '../../store';
import apiService from '../../api/apiService';
import { resetAuth } from '../../store/slices/authSlice';

// Validation schema using Yup
const validationSchema = Yup.object({
  dateOfBirth: Yup.date()
    .required('Date of birth is required')
    .max(new Date(), 'Date of birth cannot be in the future'),
  gender: Yup.string()
    .required('Gender is required')
    .oneOf(['male', 'female', 'other'], 'Invalid gender'),
  bloodType: Yup.string()
    .required('Blood type is required')
    .oneOf(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], 'Invalid blood type'),
  height: Yup.number()
    .required('Height is required')
    .min(50, 'Height must be at least 50 cm')
    .max(300, 'Height cannot exceed 300 cm'),
  weight: Yup.number()
    .required('Weight is required')
    .min(20, 'Weight must be at least 20 kg')
    .max(300, 'Weight cannot exceed 300 kg'),
  allergies: Yup.array()
    .of(Yup.string().trim().required('Allergy cannot be empty'))
    .min(1, 'At least one allergy is required')
    .required('Allergies are required'),
  medications: Yup.array()
    .of(Yup.string().trim().required('Medication cannot be empty'))
    .min(1, 'At least one medication is required')
    .required('Medications are required'),
  chronicConditions: Yup.array()
    .of(Yup.string().trim().required('Condition cannot be empty'))
    .min(1, 'At least one chronic condition is required')
    .required('Chronic conditions are required'),
  emergencyContactName: Yup.string()
    .required('Emergency contact name is required'),
  emergencyContactPhone: Yup.string()
    .required('Emergency contact phone is required')
    .matches(/^\+\d{10,15}$/, 'Phone number must start with + and contain 10-15 digits'),
  emergencyContactRelation: Yup.string()
    .required('Emergency contact relation is required'),
  address: Yup.string()
    .required('Address is required'),
  city: Yup.string()
    .required('City is required'),
  state: Yup.string()
    .required('State is required'),
  zipCode: Yup.string()
    .required('Zip code is required')
    .matches(/^\d{5}$/, 'Zip code must be 5 digits'),
  country: Yup.string()
    .required('Country is required'),
  phone: Yup.string()
    .required('Phone is required')
    .matches(/^\+\d{10,15}$/, 'Phone number must start with + and contain 10-15 digits'),
  insuranceProvider: Yup.string()
    .required('Insurance provider is required'),
  insurancePolicyNumber: Yup.string()
    .required('Insurance policy number is required'),
});

interface FormValues {
  user: string;
  dateOfBirth: string;
  gender: string;
  bloodType: string;
  height: string | number;
  weight: string | number;
  allergies: string[];
  medications: string[];
  chronicConditions: string[];
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelation: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone: string;
  insuranceProvider: string;
  insurancePolicyNumber: string;
}

interface ProfileResponse {
  _id: string;
  user: {
    _id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    isActive: boolean;
    emailVerified: boolean;
    createdAt: string;
    updatedAt: string;
    __v: number;
  };
  dateOfBirth: string;
  gender: string;
  bloodType: string;
  height: number;
  weight: number;
  allergies: string[];
  medications: string[];
  chronicConditions: string[];
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelation: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone: string;
  insuranceProvider: string;
  insurancePolicyNumber: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

const PatientProfile: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, accessToken } = useSelector((state: RootState) => state.auth);
  const [isUpdateMode, setIsUpdateMode] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [initialValues, setInitialValues] = useState<FormValues>({
    user: '',
    dateOfBirth: '',
    gender: '',
    bloodType: '',
    height: '',
    weight: '',
    allergies: [''],
    medications: [''],
    chronicConditions: [''],
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelation: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    phone: '',
    insuranceProvider: '',
    insurancePolicyNumber: '',
  });

  // Format date to YYYY-MM-DD
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        console.warn('Invalid date format:', dateString);
        return '';
      }
      return date.toISOString().split('T')[0];
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  };

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user?.id || !accessToken) {
      dispatch({ type: 'NOTIFY_ERROR', payload: 'Please log in to access your profile' });
      dispatch(resetAuth());
      navigate('/login');
      return;
    }

    // Set user ID in initial values
    setInitialValues((prev) => ({ ...prev, user: user.id }));

    // Fetch existing patient profile
    const fetchProfile = async () => {
      try {
        const response = await apiService.get<ProfileResponse>('/patients/profile');
        console.log('GET API Response:', response);
        if (response.data) {
          setIsUpdateMode(true);
          setProfileId(response.data._id);
          setInitialValues({
            user: response.data.user?._id || user.id,
            dateOfBirth: response.data.dateOfBirth ? formatDate(response.data.dateOfBirth) : '',
            gender: response.data.gender || '',
            bloodType: response.data.bloodType || '',
            height: response.data.height || '',
            weight: response.data.weight || '',
            allergies: response.data.allergies?.length > 0 ? response.data.allergies : [''],
            medications: response.data.medications?.length > 0 ? response.data.medications : [''],
            chronicConditions: response.data.chronicConditions?.length > 0 ? response.data.chronicConditions : [''],
            emergencyContactName: response.data.emergencyContactName || '',
            emergencyContactPhone: response.data.emergencyContactPhone || '',
            emergencyContactRelation: response.data.emergencyContactRelation || '',
            address: response.data.address || '',
            city: response.data.city || '',
            state: response.data.state || '',
            zipCode: response.data.zipCode || '',
            country: response.data.country || '',
            phone: response.data.phone || '',
            insuranceProvider: response.data.insuranceProvider || '',
            insurancePolicyNumber: response.data.insurancePolicyNumber || '',
          });
        }
      } catch (error: any) {
        console.error('GET API Error:', error);
        const errorMessage = error.message || 'Failed to load patient profile';
        const statusCode = error.statusCode || (error.response?.status as number | undefined);
        if (statusCode === 401) {
          dispatch({ type: 'NOTIFY_ERROR', payload: 'Session expired. Please log in again.' });
          dispatch(resetAuth());
          navigate('/login');
        } else if (statusCode === 404) {
          // No profile found, proceed with create mode
          setIsUpdateMode(false);
          setProfileId(null);
        } else {
          dispatch({ type: 'NOTIFY_ERROR', payload: errorMessage });
        }
      }
    };

    fetchProfile();
  }, [user, accessToken, dispatch, navigate]);

  const handleSubmit = async (
    values: FormValues,
    { setSubmitting }: { setSubmitting: (isSubmitting: boolean) => void }
  ) => {
    try {
      // Prepare payload
      const basePayload = {
        dateOfBirth: values.dateOfBirth,
        gender: values.gender,
        bloodType: values.bloodType,
        height: Number(values.height) || 0,
        weight: Number(values.weight) || 0,
        allergies: values.allergies.filter((item) => item.trim() !== ''),
        medications: values.medications.filter((item) => item.trim() !== ''),
        chronicConditions: values.chronicConditions.filter((item) => item.trim() !== ''),
        emergencyContactName: values.emergencyContactName,
        emergencyContactPhone: values.emergencyContactPhone,
        emergencyContactRelation: values.emergencyContactRelation,
        address: values.address,
        city: values.city,
        state: values.state,
        zipCode: values.zipCode,
        country: values.country,
        phone: values.phone,
        insuranceProvider: values.insuranceProvider,
        insurancePolicyNumber: values.insurancePolicyNumber,
      };

      const payload = isUpdateMode
        ? basePayload // Exclude user for PATCH
        : { ...basePayload, user: values.user }; // Include user for POST

      // Log payload for debugging
      console.log('Submitting payload:', payload);

      // Make POST or PATCH API call based on mode
      const response = isUpdateMode
        ? await apiService.patch(`/patients/${profileId}`, payload)
        : await apiService.post('/patients', payload);

      console.log(`${isUpdateMode ? 'PATCH' : 'POST'} API Response:`, response);
      dispatch({
        type: 'NOTIFY_SUCCESS',
        payload: isUpdateMode ? 'Patient profile updated successfully' : 'Patient profile created successfully',
      });
      navigate('/patient/dashboard'); // Redirect to dashboard on success
    } catch (error: any) {
      console.error('API Error:', error);
      const errorMessage = error.message || `Failed to ${isUpdateMode ? 'update' : 'create'} patient profile`;
      const statusCode = error.statusCode || (error.response?.status as number | undefined);
      dispatch({ type: 'NOTIFY_ERROR', payload: errorMessage });
      if (statusCode === 401) {
        dispatch({ type: 'NOTIFY_ERROR', payload: 'Session expired. Please log in again.' });
        dispatch(resetAuth());
        navigate('/login');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-md rounded-lg">
      <h2 className="text-2xl font-bold mb-6 text-center">
        {isUpdateMode ? 'Update Patient Profile' : 'Create Patient Profile'}
      </h2>
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
        enableReinitialize // Allow form to reinitialize when initialValues change
      >
        {({ values, setFieldValue, isSubmitting }) => (
          <Form className="space-y-6">
            {/* Personal Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700">
                  Date of Birth
                </label>
                <Field
                  type="date"
                  name="dateOfBirth"
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                />
                <ErrorMessage name="dateOfBirth" component="div" className="text-red-500 text-sm mt-1" />
              </div>
              <div>
                <label htmlFor="gender" className="block text-sm font-medium text-gray-700">
                  Gender
                </label>
                <Field
                  as="select"
                  name="gender"
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </Field>
                <ErrorMessage name="gender" component="div" className="text-red-500 text-sm mt-1" />
              </div>
            </div>

            {/* Medical Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="bloodType" className="block text-sm font-medium text-gray-700">
                  Blood Type
                </label>
                <Field
                  as="select"
                  name="bloodType"
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                >
                  <option value="">Select Blood Type</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </Field>
                <ErrorMessage name="bloodType" component="div" className="text-red-500 text-sm mt-1" />
              </div>
              <div>
                <label htmlFor="height" className="block text-sm font-medium text-gray-700">
                  Height (cm)
                </label>
                <Field
                  type="number"
                  name="height"
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                />
                <ErrorMessage name="height" component="div" className="text-red-500 text-sm mt-1" />
              </div>
              <div>
                <label htmlFor="weight" className="block text-sm font-medium text-gray-700">
                  Weight (kg)
                </label>
                <Field
                  type="number"
                  name="weight"
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                />
                <ErrorMessage name="weight" component="div" className="text-red-500 text-sm mt-1" />
              </div>
            </div>

            {/* Allergies */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Allergies</label>
              {values.allergies.map((_, index) => (
                <div key={index} className="flex items-center mt-2">
                  <Field
                    type="text"
                    name={`allergies[${index}]`}
                    className="block w-full p-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                  />
                  {values.allergies.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        const newAllergies = values.allergies.filter((_, i) => i !== index);
                        setFieldValue('allergies', newAllergies);
                      }}
                      className="ml-2 text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => setFieldValue('allergies', [...values.allergies, ''])}
                className="mt-2 text-primary hover:text-primary-dark"
              >
                + Add Allergy
              </button>
              <ErrorMessage name="allergies" component="div" className="text-red-500 text-sm mt-1" />
            </div>

            {/* Medications */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Medications</label>
              {values.medications.map((_, index) => (
                <div key={index} className="flex items-center mt-2">
                  <Field
                    type="text"
                    name={`medications[${index}]`}
                    className="block w-full p-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                  />
                  {values.medications.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        const newMedications = values.medications.filter((_, i) => i !== index);
                        setFieldValue('medications', newMedications);
                      }}
                      className="ml-2 text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => setFieldValue('medications', [...values.medications, ''])}
                className="mt-2 text-primary hover:text-primary-dark"
              >
                + Add Medication
              </button>
              <ErrorMessage name="medications" component="div" className="text-red-500 text-sm mt-1" />
            </div>

            {/* Chronic Conditions */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Chronic Conditions</label>
              {values.chronicConditions.map((_, index) => (
                <div key={index} className="flex items-center mt-2">
                  <Field
                    type="text"
                    name={`chronicConditions[${index}]`}
                    className="block w-full p-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                  />
                  {values.chronicConditions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        const newConditions = values.chronicConditions.filter((_, i) => i !== index);
                        setFieldValue('chronicConditions', newConditions);
                      }}
                      className="ml-2 text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => setFieldValue('chronicConditions', [...values.chronicConditions, ''])}
                className="mt-2 text-primary hover:text-primary-dark"
              >
                + Add Condition
              </button>
              <ErrorMessage name="chronicConditions" component="div" className="text-red-500 text-sm mt-1" />
            </div>

            {/* Emergency Contact */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="emergencyContactName" className="block text-sm font-medium text-gray-700">
                  Emergency Contact Name
                </label>
                <Field
                  type="text"
                  name="emergencyContactName"
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                />
                <ErrorMessage name="emergencyContactName" component="div" className="text-red-500 text-sm mt-1" />
              </div>
              <div>
                <label htmlFor="emergencyContactPhone" className="block text-sm font-medium text-gray-700">
                  Emergency Contact Phone
                </label>
                <Field
                  type="text"
                  name="emergencyContactPhone"
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                />
                <ErrorMessage name="emergencyContactPhone" component="div" className="text-red-500 text-sm mt-1" />
              </div>
              <div>
                <label htmlFor="emergencyContactRelation" className="block text-sm font-medium text-gray-700">
                  Emergency Contact Relation
                </label>
                <Field
                  type="text"
                  name="emergencyContactRelation"
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                />
                <ErrorMessage name="emergencyContactRelation" component="div" className="text-red-500 text-sm mt-1" />
              </div>
            </div>

            {/* Address */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                  Address
                </label>
                <Field
                  type="text"
                  name="address"
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                />
                <ErrorMessage name="address" component="div" className="text-red-500 text-sm mt-1" />
              </div>
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                  City
                </label>
                <Field
                  type="text"
                  name="city"
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                />
                <ErrorMessage name="city" component="div" className="text-red-500 text-sm mt-1" />
              </div>
              <div>
                <label htmlFor="state" className="block text-sm font-medium text-gray-700">
                  State
                </label>
                <Field
                  type="text"
                  name="state"
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                />
                <ErrorMessage name="state" component="div" className="text-red-500 text-sm mt-1" />
              </div>
              <div>
                <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700">
                  Zip Code
                </label>
                <Field
                  type="text"
                  name="zipCode"
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                />
                <ErrorMessage name="zipCode" component="div" className="text-red-500 text-sm mt-1" />
              </div>
              <div>
                <label htmlFor="country" className="block text-sm font-medium text-gray-700">
                  Country
                </label>
                <Field
                  type="text"
                  name="country"
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                />
                <ErrorMessage name="country" component="div" className="text-red-500 text-sm mt-1" />
              </div>
            </div>

            {/* Contact and Insurance */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Phone
                </label>
                <Field
                  type="text"
                  name="phone"
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                />
                <ErrorMessage name="phone" component="div" className="text-red-500 text-sm mt-1" />
              </div>
              <div>
                <label htmlFor="insuranceProvider" className="block text-sm font-medium text-gray-700">
                  Insurance Provider
                </label>
                <Field
                  type="text"
                  name="insuranceProvider"
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                />
                <ErrorMessage name="insuranceProvider" component="div" className="text-red-500 text-sm mt-1" />
              </div>
              <div>
                <label htmlFor="insurancePolicyNumber" className="block text-sm font-medium text-gray-700">
                  Insurance Policy Number
                </label>
                <Field
                  type="text"
                  name="insurancePolicyNumber"
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                />
                <ErrorMessage name="insurancePolicyNumber" component="div" className="text-red-500 text-sm mt-1" />
              </div>
            </div>

            {/* Submit Button */}
            <div className="text-center">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-primary text-white rounded-md hover:bg-primary-dark disabled:bg-gray-400"
              >
                {isSubmitting ? 'Submitting...' : isUpdateMode ? 'Update Profile' : 'Create Profile'}
              </button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default PatientProfile;