import { useState, useEffect } from 'react';
import './styles/global.css';
import apiService from './services/apiService';

function App() {
  // State management
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [credits, setCredits] = useState(0);
  const [activeView, setActiveView] = useState('home'); // 'home', 'login', 'register', 'profile', 'analyze'
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [userComment, setUserComment] = useState('');
  
  // Form fields
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ 
    email: '', 
    password: '', 
    confirmPassword: '',
    firstName: '',
    lastName: '' 
  });

  // Check authentication status on load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = apiService.getToken();
        if (token) {
          const userData = apiService.getUser();
          if (userData) {
            setUser(userData);
            setIsLoggedIn(true);
            
            try {
              // Get updated user data and credits
              const updatedProfile = await apiService.getUserProfile();
              setUser(updatedProfile);
              
              const creditsData = await apiService.getCredits();
              setCredits(creditsData.balance || 0);
            } catch (error) {
              console.error("Couldn't refresh user data, using cached data", error);
            }
          }
        }
      } catch (error) {
        console.error('Auth check error:', error);
        // If there's an authentication error, log out
        handleLogout();
      }
    };
    
    checkAuth();
  }, []);
  
  // Handlers
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await apiService.login({
        email: loginForm.email,
        password: loginForm.password
      });
      
      setUser(result.user);
      setCredits(result.user.credits || 0);
      setIsLoggedIn(true);
      setActiveView('home');
    } catch (err) {
      setError(err.message || 'Login mislukt. Controleer uw inloggegevens.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    if (registerForm.password !== registerForm.confirmPassword) {
      setError('Wachtwoorden komen niet overeen');
      setIsLoading(false);
      return;
    }
    
    try {
      const result = await apiService.register({
        email: registerForm.email,
        password: registerForm.password,
        first_name: registerForm.firstName,
        last_name: registerForm.lastName
      });
      
      setUser(result.user);
      setCredits(result.user.credits || 0);
      setIsLoggedIn(true);
      setActiveView('home');
    } catch (err) {
      setError(err.message || 'Registratie mislukt. Probeer het opnieuw.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleLogout = () => {
    apiService.logout();
    setIsLoggedIn(false);
    setUser(null);
    setCredits(0);
    setActiveView('home');
  };
  
  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      
      // Reset previous analysis
      setAnalysisResult(null);
    }
  };
  
  const handleAnalyzeImage = async () => {
    if (!selectedImage) {
      setError('Selecteer eerst een afbeelding');
      return;
    }
    
    if (credits < 1) {
      setError('Onvoldoende credits. Koop credits om afbeeldingen te analyseren.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await apiService.analyzeImage(selectedImage, userComment);
      setAnalysisResult(result);
      
      // Update credits after successful analysis
      try {
        const creditsData = await apiService.getCredits();
        setCredits(creditsData.balance || 0);
      } catch (error) {
        console.error("Couldn't refresh credits", error);
      }
    } catch (err) {
      setError(err.message || 'Analyse mislukt. Probeer het opnieuw.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Render helper functions
  const renderLoginForm = () => (
    <div className="max-w-md mx-auto elegant-card p-8">
      <h2 className="text-xl font-serif mb-6 text-center text-antique-900 elegant-heading">Inloggen</h2>
      
      {error && (
        <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 rounded-elegant">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        </div>
      )}
      
      <form onSubmit={handleLogin} className="space-y-5">
        <div>
          <label className="block text-antique-800 mb-2 font-serif text-sm" htmlFor="email">
            E-mailadres
          </label>
          <input
            type="email"
            id="email"
            className="elegant-input"
            value={loginForm.email}
            onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
            required
            placeholder="uw@email.nl"
          />
        </div>
        
        <div>
          <label className="block text-antique-800 mb-2 font-serif text-sm" htmlFor="password">
            Wachtwoord
          </label>
          <input
            type="password"
            id="password"
            className="elegant-input"
            value={loginForm.password}
            onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
            required
            placeholder="••••••••"
          />
        </div>
        
        <button
          type="submit"
          className={`elegant-btn-primary w-full ${isLoading ? 'opacity-70 cursor-wait' : ''}`}
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-sm">Een moment geduld...</span>
            </div>
          ) : (
            'Inloggen'
          )}
        </button>
      </form>
      
      <div className="mt-6 text-center">
        <p className="text-antique-700 text-sm">
          Nog geen account?{' '}
          <button
            className="text-antique-600 hover:text-antique-800 font-medium"
            onClick={() => setActiveView('register')}
          >
            Registreer nu
          </button>
        </p>
      </div>
    </div>
  );
  
  const renderRegisterForm = () => (
    <div className="max-w-md mx-auto elegant-card p-8">
      <h2 className="text-xl font-serif mb-6 text-center text-antique-900 elegant-heading">Account Registreren</h2>
      
      {error && (
        <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 rounded-elegant">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        </div>
      )}
      
      <form onSubmit={handleRegister} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-antique-800 mb-2 font-serif text-sm" htmlFor="firstName">
              Voornaam
            </label>
            <input
              type="text"
              id="firstName"
              className="elegant-input"
              value={registerForm.firstName}
              onChange={(e) => setRegisterForm({...registerForm, firstName: e.target.value})}
              required
              placeholder="Jan"
            />
          </div>
          
          <div>
            <label className="block text-antique-800 mb-2 font-serif text-sm" htmlFor="lastName">
              Achternaam
            </label>
            <input
              type="text"
              id="lastName"
              className="elegant-input"
              value={registerForm.lastName}
              onChange={(e) => setRegisterForm({...registerForm, lastName: e.target.value})}
              required
              placeholder="Jansen"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-antique-800 mb-2 font-serif text-sm" htmlFor="registerEmail">
            E-mailadres
          </label>
          <input
            type="email"
            id="registerEmail"
            className="elegant-input"
            value={registerForm.email}
            onChange={(e) => setRegisterForm({...registerForm, email: e.target.value})}
            required
            placeholder="uw@email.nl"
          />
        </div>
        
        <div>
          <label className="block text-antique-800 mb-2 font-serif text-sm" htmlFor="registerPassword">
            Wachtwoord
          </label>
          <input
            type="password"
            id="registerPassword"
            className="elegant-input"
            value={registerForm.password}
            onChange={(e) => setRegisterForm({...registerForm, password: e.target.value})}
            required
            placeholder="••••••••"
          />
          <p className="mt-1 text-xs text-antique-500 italic">Minimaal 8 tekens</p>
        </div>
        
        <div>
          <label className="block text-antique-800 mb-2 font-serif text-sm" htmlFor="confirmPassword">
            Bevestig wachtwoord
          </label>
          <input
            type="password"
            id="confirmPassword"
            className="elegant-input"
            value={registerForm.confirmPassword}
            onChange={(e) => setRegisterForm({...registerForm, confirmPassword: e.target.value})}
            required
            placeholder="••••••••"
          />
        </div>
        
        <button
          type="submit"
          className={`elegant-btn-primary w-full ${isLoading ? 'opacity-70 cursor-wait' : ''}`}
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-sm">Even geduld...</span>
            </div>
          ) : (
            'Registreren'
          )}
        </button>
      </form>
      
      <div className="mt-6 text-center">
        <p className="text-antique-700 text-sm">
          Heeft u al een account?{' '}
          <button
            className="text-antique-600 hover:text-antique-800 font-medium"
            onClick={() => setActiveView('login')}
          >
            Inloggen
          </button>
        </p>
      </div>
    </div>
  );
  
  const renderAnalyzeView = () => (
    <div className="max-w-4xl mx-auto elegant-card p-8">
      <h2 className="text-xl font-serif mb-6 text-antique-900 elegant-heading text-center">Analyse van Antiek Object</h2>
      
      {error && (
        <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 rounded-elegant text-sm">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        </div>
      )}
      
      <div className="mb-6 p-4 bg-antique-50 border border-antique-200 rounded-elegant text-sm">
        <div className="flex items-center text-antique-800">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span className="font-medium">Beschikbare credits: {credits}</span>
        </div>
        <p className="text-xs text-antique-600 mt-1">Voor een analyse wordt 1 credit in rekening gebracht.</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <div className="mb-6">
            <label className="block text-antique-800 mb-2 font-serif text-sm" htmlFor="imageUpload">
              Foto van uw antieke object
            </label>
            <div className="border border-dashed border-antique-300 rounded-elegant p-4 text-center hover:border-antique-400 transition-colors">
              <input
                type="file"
                id="imageUpload"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
              <label htmlFor="imageUpload" className="cursor-pointer block">
                {imagePreview ? (
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="max-h-56 mx-auto object-contain"
                  />
                ) : (
                  <div className="py-6">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto text-antique-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="mt-2 text-antique-600 text-sm">Klik om een foto te selecteren</p>
                    <p className="mt-1 text-xs text-antique-500 italic">JPG, PNG of HEIC</p>
                  </div>
                )}
              </label>
            </div>
          </div>
          
          <div className="mb-6">
            <label className="block text-antique-800 mb-2 font-serif text-sm" htmlFor="comment">
              Aanvullende informatie (optioneel)
            </label>
            <textarea
              id="comment"
              rows="3"
              placeholder="Voeg eventuele details toe over het object..."
              className="elegant-input"
              value={userComment}
              onChange={(e) => setUserComment(e.target.value)}
            ></textarea>
          </div>
          
          <button
            onClick={handleAnalyzeImage}
            disabled={!selectedImage || isLoading || credits < 1}
            className={`w-full elegant-btn-primary flex items-center justify-center ${
              !selectedImage || credits < 1
                ? 'opacity-50 cursor-not-allowed'
                : isLoading
                  ? 'opacity-70 cursor-wait'
                  : ''
            }`}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Analyse wordt uitgevoerd...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Object Analyseren
              </>
            )}
          </button>
        </div>
        
        <div>
          {analysisResult ? (
            <div className="elegant-card p-6">
              <h3 className="text-lg font-serif mb-4 text-antique-800 elegant-heading">Resultaat van Analyse</h3>
              
              <div className="space-y-4 text-sm">
                <div>
                  <h4 className="font-medium text-antique-700 mb-1">Object Type:</h4>
                  <p className="text-antique-900">{analysisResult.object_type}</p>
                </div>
                
                <div>
                  <h4 className="font-medium text-antique-700 mb-1">Periode:</h4>
                  <p className="text-antique-900">{analysisResult.period}</p>
                </div>
                
                <div>
                  <h4 className="font-medium text-antique-700 mb-1">Geschatte Waarde:</h4>
                  <p className="text-antique-900 font-medium text-base">{analysisResult.estimated_value}</p>
                </div>
                
                <div>
                  <h4 className="font-medium text-antique-700 mb-1">Beschrijving:</h4>
                  <p className="text-antique-900">{analysisResult.description}</p>
                </div>
                
                {analysisResult.additional_info && (
                  <div>
                    <h4 className="font-medium text-antique-700 mb-1">Aanvullende Informatie:</h4>
                    <p className="text-antique-900">{analysisResult.additional_info}</p>
                  </div>
                )}
              </div>
              
              <div className="mt-6 flex justify-end">
                <button 
                  className="text-antique-600 hover:text-antique-800 font-medium flex items-center text-sm"
                  onClick={() => {
                    setSelectedImage(null);
                    setImagePreview(null);
                    setAnalysisResult(null);
                    setUserComment('');
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Nieuwe analyse
                </button>
              </div>
            </div>
          ) : (
            <div className="border rounded-elegant bg-antique-50 p-6 flex flex-col items-center justify-center h-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-antique-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="mt-4 text-antique-600 text-center text-sm">
                Hier verschijnen uw analyseresultaten nadat u een object heeft laten analyseren.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
  
  const renderHomeView = () => (
    <div className="max-w-5xl mx-auto">
      <div className="elegant-card p-8 mb-10">
        <div className="text-center max-w-2xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-serif mb-4 text-antique-900 tracking-wide elegant-heading">
            Ontdek de geschiedenis en waarde van uw antieke objecten
          </h1>
          <div className="w-16 h-0.5 bg-antique-300 mx-auto my-4"></div>
          <p className="text-base md:text-lg mb-8 text-antique-700 font-serif">
            AntiqBot gebruikt geavanceerde AI-technologie om uw antieke voorwerpen te identificeren, dateren en de waarde te bepalen.
          </p>
          
          {isLoggedIn ? (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-center gap-4">
              <button
                onClick={() => setActiveView('analyze')}
                className="elegant-btn-primary text-sm"
              >
                <span className="flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  Object Analyseren
                </span>
              </button>
              <div className="text-antique-700 font-serif text-sm">
                U heeft <span className="font-medium">{credits}</span> credits beschikbaar
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:justify-center items-center gap-4">
              <button
                onClick={() => setActiveView('login')}
                className="elegant-btn-primary text-sm"
              >
                Inloggen
              </button>
              <button
                onClick={() => setActiveView('register')}
                className="elegant-btn-secondary text-sm"
              >
                Registreren
              </button>
            </div>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="elegant-card p-6">
          <div className="w-10 h-10 bg-antique-50 rounded-full flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-antique-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="text-base font-serif mb-2 text-antique-800">Identificatie</h3>
          <p className="text-antique-600 text-sm">Ontdek direct wat voor antiek object u in bezit heeft met onze geavanceerde AI-technologie.</p>
        </div>
        
        <div className="elegant-card p-6">
          <div className="w-10 h-10 bg-antique-50 rounded-full flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-antique-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-base font-serif mb-2 text-antique-800">Waardebepaling</h3>
          <p className="text-antique-600 text-sm">Krijg een betrouwbare schatting van de waarde van uw antieke objecten op basis van vergelijkbare items.</p>
        </div>
        
        <div className="elegant-card p-6">
          <div className="w-10 h-10 bg-antique-50 rounded-full flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-antique-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h3 className="text-base font-serif mb-2 text-antique-800">Historische Context</h3>
          <p className="text-antique-600 text-sm">Leer meer over de geschiedenis, herkomst en culturele context van uw antieke voorwerpen.</p>
        </div>
      </div>
      
      <div className="elegant-card p-8 text-center mb-12">
        <h2 className="text-lg font-serif mb-6 text-antique-800 elegant-heading">Hoe het werkt</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="w-8 h-8 bg-antique-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-antique-200">
              <span className="text-antique-700 text-sm">1</span>
            </div>
            <h3 className="font-medium text-antique-800 text-sm mb-2">Upload een foto</h3>
            <p className="text-antique-600 text-xs">Maak een duidelijke foto van uw antieke object</p>
          </div>
          
          <div className="text-center">
            <div className="w-8 h-8 bg-antique-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-antique-200">
              <span className="text-antique-700 text-sm">2</span>
            </div>
            <h3 className="font-medium text-antique-800 text-sm mb-2">AI-analyse</h3>
            <p className="text-antique-600 text-xs">Onze AI analyseert het object binnen enkele seconden</p>
          </div>
          
          <div className="text-center">
            <div className="w-8 h-8 bg-antique-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-antique-200">
              <span className="text-antique-700 text-sm">3</span>
            </div>
            <h3 className="font-medium text-antique-800 text-sm mb-2">Ontvang resultaten</h3>
            <p className="text-antique-600 text-xs">Bekijk de gedetailleerde analyse en waardebepaling</p>
          </div>
          
          <div className="text-center">
            <div className="w-8 h-8 bg-antique-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-antique-200">
              <span className="text-antique-700 text-sm">4</span>
            </div>
            <h3 className="font-medium text-antique-800 text-sm mb-2">Bewaar of deel</h3>
            <p className="text-antique-600 text-xs">Sla de resultaten op of deel ze met anderen</p>
          </div>
        </div>
      </div>
    </div>
  );
  
  // Profile View
  const renderProfileView = () => (
    <div className="max-w-4xl mx-auto elegant-card p-8">
      <h2 className="text-xl font-serif mb-6 text-antique-900 elegant-heading">Mijn Account</h2>
      
      <div className="mb-8 p-6 bg-antique-50 rounded-elegant border border-antique-100">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-base font-serif mb-4 text-antique-800">Persoonlijke Gegevens</h3>
            <div className="space-y-3">
              <div>
                <span className="font-medium text-antique-700 text-sm">Naam:</span>
                <p className="text-antique-900">{user?.first_name} {user?.last_name}</p>
              </div>
              <div>
                <span className="font-medium text-antique-700 text-sm">E-mail:</span>
                <p className="text-antique-900">{user?.email}</p>
              </div>
              <div>
                <span className="font-medium text-antique-700 text-sm">Credits:</span>
                <p className="text-antique-900 font-medium">{credits}</p>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-base font-serif mb-4 text-antique-800">Account Details</h3>
            <div className="space-y-3">
              <div>
                <span className="font-medium text-antique-700 text-sm">Lidmaatschap:</span>
                <p className="text-antique-900">Standaard</p>
              </div>
              <div>
                <span className="font-medium text-antique-700 text-sm">Lid sinds:</span>
                <p className="text-antique-900">{user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Onbekend'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mb-8">
        <h3 className="text-base font-serif mb-4 text-antique-800">Credits Aanschaffen</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="elegant-card p-6 text-center">
            <div className="mb-2 text-xs font-medium text-antique-500">Basis</div>
            <div className="text-xl font-serif mb-2 text-antique-800">€9,99</div>
            <div className="mb-4 px-3 py-0.5 bg-antique-50 rounded-full text-antique-800 font-medium inline-block text-xs">
              10 Credits
            </div>
            <p className="text-antique-600 text-xs mb-4">Voor wie af en toe een voorwerp wil laten analyseren.</p>
            <button className="elegant-btn-primary w-full text-sm">
              Kopen
            </button>
          </div>
          
          <div className="elegant-card p-6 text-center shadow-elegant relative border-2 border-antique-400">
            <div className="absolute top-0 right-0 bg-antique-600 text-white text-xs px-2 py-0.5 rounded-bl-elegant rounded-tr-elegant font-medium text-xs">
              POPULAIR
            </div>
            <div className="mb-2 text-xs font-medium text-antique-500">Standaard</div>
            <div className="text-xl font-serif mb-2 text-antique-800">€24,99</div>
            <div className="mb-4 px-3 py-0.5 bg-antique-50 rounded-full text-antique-800 font-medium inline-block text-xs">
              30 Credits
            </div>
            <p className="text-antique-600 text-xs mb-4">Ideaal voor regelmatige gebruikers met meerdere objecten.</p>
            <button className="elegant-btn-primary w-full text-sm">
              Kopen
            </button>
          </div>
          
          <div className="elegant-card p-6 text-center">
            <div className="mb-2 text-xs font-medium text-antique-500">Premium</div>
            <div className="text-xl font-serif mb-2 text-antique-800">€49,99</div>
            <div className="mb-4 px-3 py-0.5 bg-antique-50 rounded-full text-antique-800 font-medium inline-block text-xs">
              75 Credits
            </div>
            <p className="text-antique-600 text-xs mb-4">Voor verzamelaars en professionals met veel voorwerpen.</p>
            <button className="elegant-btn-primary w-full text-sm">
              Kopen
            </button>
          </div>
        </div>
      </div>
      
      <div>
        <h3 className="text-base font-serif mb-4 text-antique-800">Recent Geanalyseerde Objecten</h3>
        <div className="bg-antique-50 rounded-elegant p-6 text-center border border-antique-100">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto text-antique-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <p className="text-antique-600 text-center text-sm">
            Hier verschijnen uw analyseresultaten nadat u een object heeft laten analyseren.
          </p>
          <button
            onClick={() => setActiveView('analyze')}
            className="elegant-btn-primary mt-4 text-xs"
          >
            Eerste object analyseren
          </button>
        </div>
      </div>
    </div>
  );
  
  // Main Navigation
  const renderNavigation = () => (
    <header className="elegant-header py-4">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center">
          <div>
            <button 
              onClick={() => setActiveView('home')}
              className="text-xl font-serif text-antique-800 tracking-wide elegant-heading"
            >
              AntiqBot
            </button>
          </div>
          
          <nav className="hidden md:flex space-x-6">
            <button 
              onClick={() => setActiveView('home')}
              className={`text-sm font-serif ${activeView === 'home' ? 'text-antique-800' : 'text-antique-600 hover:text-antique-800'}`}
            >
              Home
            </button>
            
            {isLoggedIn && (
              <button 
                onClick={() => setActiveView('analyze')}
                className={`text-sm font-serif ${activeView === 'analyze' ? 'text-antique-800' : 'text-antique-600 hover:text-antique-800'}`}
              >
                Analyseren
              </button>
            )}
            
            <a href="#" className="text-sm font-serif text-antique-600 hover:text-antique-800">
              Over Ons
            </a>
          </nav>
          
          <div className="flex items-center space-x-4">
            {isLoggedIn ? (
              <>
                <span className="hidden md:inline-block bg-antique-50 text-antique-700 px-3 py-1 rounded-full text-xs font-medium border border-antique-100">
                  {credits} Credits
                </span>
                
                <div className="flex items-center">
                  <button
                    onClick={() => setActiveView('profile')}
                    className="flex items-center text-sm font-serif text-antique-600 hover:text-antique-800"
                  >
                    <span className="hidden md:inline-block mr-2">{user?.first_name}</span>
                    <div className="h-7 w-7 rounded-full bg-antique-100 flex items-center justify-center text-antique-700 font-serif text-xs">
                      {user?.first_name ? user.first_name.charAt(0) : 'G'}
                    </div>
                  </button>
                  
                  <button
                    onClick={handleLogout}
                    className="ml-4 text-sm font-serif text-antique-600 hover:text-antique-800 md:border md:border-antique-100 md:px-3 md:py-1 md:rounded-elegant md:hover:bg-antique-50"
                  >
                    <span className="hidden md:inline-block">Uitloggen</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </button>
                </div>
              </>
            ) : (
              <>
                <button
                  onClick={() => setActiveView('login')}
                  className="text-sm font-serif text-antique-600 hover:text-antique-800 md:border md:border-antique-100 md:px-3 md:py-1 md:rounded-elegant md:hover:bg-antique-50"
                >
                  Inloggen
                </button>
                
                <button
                  onClick={() => setActiveView('register')}
                  className="elegant-btn-primary text-sm hidden md:inline-block"
                >
                  Registreren
                </button>
              </>
            )}
            
            {/* Mobile menu button */}
            <button
              className="md:hidden p-1"
              onClick={() => {
                // Toggle mobile menu
                const mobileMenu = document.getElementById('mobile-menu');
                if (mobileMenu) {
                  mobileMenu.classList.toggle('hidden');
                }
              }}
            >
              <svg className="h-6 w-6 text-antique-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      <div id="mobile-menu" className="hidden md:hidden mt-4 border-t border-antique-100 pt-4 px-4">
        <nav className="space-y-3">
          <button 
            onClick={() => {
              setActiveView('home');
              document.getElementById('mobile-menu').classList.add('hidden');
            }}
            className="block text-antique-700 hover:text-antique-900 font-serif"
          >
            Home
          </button>
          
          {isLoggedIn && (
            <button 
              onClick={() => {
                setActiveView('analyze');
                document.getElementById('mobile-menu').classList.add('hidden');
              }}
              className="block text-antique-700 hover:text-antique-900 font-serif"
            >
              Analyseren
            </button>
          )}
          
          <a 
            href="#" 
            className="block text-antique-700 hover:text-antique-900 font-serif"
            onClick={() => document.getElementById('mobile-menu').classList.add('hidden')}
          >
            Over Ons
          </a>
          
          {!isLoggedIn && (
            <button 
              onClick={() => {
                setActiveView('register');
                document.getElementById('mobile-menu').classList.add('hidden');
              }}
              className="block text-antique-700 hover:text-antique-900 font-serif"
            >
              Registreren
            </button>
          )}
          
          {isLoggedIn && (
            <button 
              onClick={() => {
                setActiveView('profile');
                document.getElementById('mobile-menu').classList.add('hidden');
              }}
              className="block text-antique-700 hover:text-antique-900 font-serif"
            >
              Mijn Account
            </button>
          )}
        </nav>
      </div>
    </header>
  );
  
  // Main app rendering
  return (
    <div className="min-h-screen flex flex-col bg-antique-50">
      {renderNavigation()}
      
      <main className="flex-grow container mx-auto px-4 py-8">
        {activeView === 'home' && renderHomeView()}
        {activeView === 'login' && renderLoginForm()}
        {activeView === 'register' && renderRegisterForm()}
        {activeView === 'analyze' && renderAnalyzeView()}
        {activeView === 'profile' && renderProfileView()}
      </main>
      
      <footer className="elegant-footer py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between">
            <div className="mb-6 md:mb-0">
              <h3 className="text-lg font-serif text-antique-200 mb-2">AntiqBot</h3>
              <p className="text-antique-400 text-sm">Antieke objecten analyseren met AI</p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-serif font-medium mb-3 text-antique-300 text-sm">Navigatie</h4>
                <ul className="space-y-2">
                  <li><button onClick={() => setActiveView('home')} className="text-antique-400 hover:text-antique-200 transition-colors text-xs">Home</button></li>
                  {isLoggedIn && <li><button onClick={() => setActiveView('analyze')} className="text-antique-400 hover:text-antique-200 transition-colors text-xs">Analyseren</button></li>}
                  {isLoggedIn && <li><button onClick={() => setActiveView('profile')} className="text-antique-400 hover:text-antique-200 transition-colors text-xs">Mijn Account</button></li>}
                </ul>
              </div>
              
              <div>
                <h4 className="font-serif font-medium mb-3 text-antique-300 text-sm">Informatie</h4>
                <ul className="space-y-2">
                  <li><a href="#" className="text-antique-400 hover:text-antique-200 transition-colors text-xs">Over Ons</a></li>
                  <li><a href="#" className="text-antique-400 hover:text-antique-200 transition-colors text-xs">Veelgestelde Vragen</a></li>
                  <li><a href="#" className="text-antique-400 hover:text-antique-200 transition-colors text-xs">Contact</a></li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-serif font-medium mb-3 text-antique-300 text-sm">Juridisch</h4>
                <ul className="space-y-2">
                  <li><a href="#" className="text-antique-400 hover:text-antique-200 transition-colors text-xs">Algemene Voorwaarden</a></li>
                  <li><a href="#" className="text-antique-400 hover:text-antique-200 transition-colors text-xs">Privacybeleid</a></li>
                  <li><a href="#" className="text-antique-400 hover:text-antique-200 transition-colors text-xs">Cookie Policy</a></li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="border-t border-antique-800 mt-6 pt-6 flex flex-col md:flex-row justify-between items-center">
            <p className="text-antique-500 text-xs">© {new Date().getFullYear()} AntiqBot. Alle rechten voorbehouden.</p>
            <div className="flex space-x-4 mt-4 md:mt-0">
              <a href="#" className="text-antique-400 hover:text-antique-200 transition-colors">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z" />
                </svg>
              </a>
              <a href="#" className="text-antique-400 hover:text-antique-200 transition-colors">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723 10.039 10.039 0 01-3.127 1.195 4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                </svg>
              </a>
              <a href="#" className="text-antique-400 hover:text-antique-200 transition-colors">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm4.441 16.892c-2.102.144-6.784.144-8.883 0C5.282 16.736 5.017 15.622 5 12c.017-3.629.285-4.736 2.558-4.892 2.099-.144 6.782-.144 8.883 0C18.718 7.264 18.982 8.378 19 12c-.018 3.629-.285 4.736-2.559 4.892zM10 9.658l4.917 2.338L10 14.342V9.658z" />
                </svg>
              </a>
              <a href="#" className="text-antique-400 hover:text-antique-200 transition-colors">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;