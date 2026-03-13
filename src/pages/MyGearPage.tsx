import { useNavigate } from 'react-router-dom';
import { useDiagnosis } from '../context/DiagnosisContext';
import { MyGear } from '../features/gear/MyGear';

export const MyGearPage = () => {
    const { profile, updateProfile, user, setUser, resetDiagnosis, saveStatus } = useDiagnosis();
    const navigate = useNavigate();

    const handleClose = () => {
        navigate(-1); // Go back to previous page
    };

    const handleLogout = () => {
        setUser({ ...user, isLoggedIn: false }); // Reset user
        resetDiagnosis();
        navigate('/'); // Go home
    };

    return (
        <div className="relative">
            <MyGear
                setting={profile.myBag}
                headSpeed={profile.headSpeed}
                onUpdate={b => updateProfile('myBag', b)}
                onUpdateHeadSpeed={s => updateProfile('headSpeed', s)}
                onClose={handleClose}
                userLoggedIn={user.isLoggedIn}
                onLogout={handleLogout}
                userName={profile.name}
                onUpdateUserName={name => updateProfile('name', name)}
                snsLinks={profile.snsLinks || {}}
                onUpdateSnsLinks={links => updateProfile('snsLinks', links)}
                coverPhoto={profile.coverPhoto}
                onUpdateCoverPhoto={photo => updateProfile('coverPhoto', photo)}
                age={profile.age}
                onUpdateAge={age => updateProfile('age', age)}
                gender={profile.gender}
                onUpdateGender={gender => updateProfile('gender', gender)}
                saveStatus={saveStatus}
            />
        </div>
    );
};
