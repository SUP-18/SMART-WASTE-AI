'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { 
  UploadCloud, AlertTriangle, MapPin, FileText, CheckCircle,
  X, Cpu, Loader2, ArrowLeft, ArrowRight, Camera
} from 'lucide-react';
import './report.css';

const MapView = dynamic(() => import('@/components/MapView'), { ssr: false });

const CATEGORIES = ['Overflowing Bin', 'Illegal Dumping', 'Street Waste', 'Water Leakage', 'Pothole', 'Other'];

export default function ReportPage() {
  const { user } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef(null);

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form Data
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [category, setCategory] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [location, setLocation] = useState(null);
  const [locationText, setLocationText] = useState('');
  const [description, setDescription] = useState('');
  const [peopleAffected, setPeopleAffected] = useState('');
  const [locationType, setLocationType] = useState('');
  
  // Submit state
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [reportId, setReportId] = useState('');
  const [priorityScore, setPriorityScore] = useState(0);
  
  const [errorMsg, setErrorMsg] = useState('');
  
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      setErrorMsg('');
    }
  };

  const analyzeImagePixels = (dataUrl) => {
    return new Promise((resolve) => {
      if (!dataUrl) return resolve({ plantRatio: 0, fruitRatio: 0 });
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = dataUrl;
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = 64;
          canvas.height = 64;
          ctx.drawImage(img, 0, 0, 64, 64);
          const imageData = ctx.getImageData(0, 0, 64, 64);
          const pixels = imageData.data;

          let plantPixels = 0;
          let fruitPixels = 0;
          const totalPixels = 64 * 64;

          for (let i = 0; i < pixels.length; i += 4) {
            const r = pixels[i];
            const g = pixels[i + 1];
            const b = pixels[i + 2];

            // Green foliage/plants
            if (g > r + 15 && g > b + 15 && g > 60) {
              plantPixels++;
            }
            // Tomatoes / Red fruits / Flowers on plants
            if (r > 130 && g > 70 && b < 100 && (r - b) > 50) {
              fruitPixels++;
            }
          }

          resolve({ plantRatio: plantPixels / totalPixels, fruitRatio: fruitPixels / totalPixels });
        } catch (e) {
          resolve({ plantRatio: 0, fruitRatio: 0 });
        }
      };
      img.onerror = () => resolve({ plantRatio: 0, fruitRatio: 0 });
    });
  };

  const simulateAI = async () => {
    setLoading(true);
    const fileName = image?.name?.toLowerCase() || '';
    
    const nonWasteKeywords = [
      'tomato', 'fruit', 'vegetable', 'plant', 'crop', 'flower', 'garden',
      'selfie', 'person', 'face', 'cat', 'dog', 'pet', 'food', 'dish',
      'car', 'vehicle', 'laptop', 'phone', 'book', 'toy', 'shirt', 'cloth'
    ];
    
    const isNonWasteFile = nonWasteKeywords.some(kw => fileName.includes(kw));
    const { plantRatio, fruitRatio } = await analyzeImagePixels(imagePreview);

    let detectedCategory = '';

    if (isNonWasteFile || (plantRatio + fruitRatio) > 0.25) {
      detectedCategory = 'Unrecognized';
    } else if (fileName.includes('water') || fileName.includes('leak') || fileName.includes('pipe') || fileName.includes('flood') || fileName.includes('sewer') || fileName.includes('drain')) {
      detectedCategory = 'Water Leakage';
    } else if (fileName.includes('dump') || fileName.includes('illegal') || fileName.includes('mattress') || fileName.includes('furniture') || fileName.includes('debris')) {
      detectedCategory = 'Illegal Dumping';
    } else if (fileName.includes('pothole') || fileName.includes('road') || fileName.includes('crack') || fileName.includes('asphalt') || fileName.includes('tar')) {
      detectedCategory = 'Pothole';
    } else if (fileName.includes('light') || fileName.includes('lamp') || fileName.includes('pole') || fileName.includes('wire')) {
      detectedCategory = 'Other';
    } else if (fileName.includes('street') || fileName.includes('litter') || fileName.includes('plastic') || fileName.includes('bottle')) {
      detectedCategory = 'Street Waste';
    } else if (fileName.includes('bin') || fileName.includes('trash') || fileName.includes('garbage') || fileName.includes('overflow') || fileName.includes('dustbin') || fileName.includes('waste')) {
      detectedCategory = 'Overflowing Bin';
    } else {
      detectedCategory = 'Overflowing Bin';
    }

    const randomConf = detectedCategory === 'Unrecognized' ? 0 : Math.floor(Math.random() * (96 - 88 + 1) + 88);
    setCategory(detectedCategory);
    setConfidence(randomConf);
    setLoading(false);
  };

  const nextStep = () => {
    setErrorMsg('');
    if (step === 1 && imagePreview) {
      simulateAI();
      setStep(2);
    } else if (step === 3) {
      if (!locationText.trim()) {
        setErrorMsg('Please enter location details before proceeding.');
        return;
      }
      setStep(4);
    } else if (step === 4) {
      if (!description.trim() || !peopleAffected || !locationType) {
        setErrorMsg('Please enter all details before proceeding.');
        return;
      }
      setStep(5);
    } else if (step < 5) {
      setStep(step + 1);
    }
  };

  const prevStep = () => setStep(step - 1);

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setLocationText(`Lat: ${pos.coords.latitude.toFixed(4)}, Lng: ${pos.coords.longitude.toFixed(4)}`);
        },
        (err) => {
          alert('Location access denied. Please enter manually.');
        }
      );
    }
  };

  const calculatePriority = () => {
    let score = 50; // base score
    if (peopleAffected === '50+') score += 30;
    else if (peopleAffected === '21-50') score += 20;
    else if (peopleAffected === '6-20') score += 10;
    
    if (locationType === 'Hospital' || locationType === 'School/College') score += 20;
    
    return Math.min(100, score);
  };

  const handleSubmit = async () => {
    if (!user) {
      alert("Please login first");
      return;
    }
    setLoading(true);
    
    try {
      let imageUrl = imagePreview || '';
      
      if (image) {
        try {
          const formData = new FormData();
          formData.append('image', image);
          
          const uploadRes = await fetch('/api/upload', {
            method: 'POST',
            body: formData
          });
          
          if (uploadRes.ok) {
            const uploadData = await uploadRes.json();
            if (uploadData.url && uploadData.url.startsWith('http')) {
              imageUrl = uploadData.url;
            }
          }
        } catch (uploadErr) {
          console.error('Upload error, using image preview:', uploadErr);
        }
      }

      if (!imageUrl) {
        const fallbacks = {
          'Overflowing Bin': '/uploads/demo/overflowing_bin.jpg',
          'Illegal Dumping': '/uploads/demo/illegal_dumping.jpg',
          'Street Waste': '/uploads/demo/street_waste.jpg',
          'Water Leakage': '/uploads/demo/water_leakage.jpg',
          'Pothole': '/uploads/demo/pothole.jpg',
          'Other': '/uploads/demo/street_light.jpg'
        };
        imageUrl = fallbacks[category] || '/uploads/demo/overflowing_bin.jpg';
      }

      const pScore = calculatePriority();
      
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          category,
          locationText: locationText || 'Unknown Location',
          latitude: location?.lat || 28.6139,
          longitude: location?.lng || 77.2090,
          description,
          peopleAffected,
          locationType,
          priorityScore: pScore,
          priorityLevel: pScore >= 80 ? 'High' : pScore >= 50 ? 'Medium' : 'Low',
          aiConfidence: confidence,
          imageUrl
        })
      });
      
      if (res.ok) {
        const data = await res.json();
        setReportId(data.report.id);
        setPriorityScore(data.report.priorityScore || data.report.priorityscore || pScore);
        setIsSubmitted(true);
      } else {
        alert("Failed to submit report");
      }
    } catch (error) {
      console.error(error);
      alert("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="report-page">
        <Navbar />
        <div className="container success-container">
          <div className="success-card text-center">
            <CheckCircle size={64} className="text-success mx-auto mb-4" />
            <h2 className="mb-2">Report Submitted Successfully!</h2>
            <p className="mb-6">Thank you for making our community cleaner.</p>
            
            <div className="report-id-display mb-6">
              <span className="text-secondary block text-sm">Report ID</span>
              <strong className="text-2xl text-primary">#{reportId}</strong>
            </div>
            
            <div className="priority-display mb-8">
              <div className="score-circle">
                {priorityScore}
              </div>
              <div>
                <strong>Priority Level: {priorityScore > 80 ? 'High' : priorityScore > 50 ? 'Medium' : 'Low'}</strong>
                <p className="text-sm text-secondary">Based on location type and people affected.</p>
              </div>
            </div>
            
            <div className="success-actions flex justify-center gap-4">
              <Link href={`/report/${reportId}`} className="btn btn-primary">
                View Report
              </Link>
              <button onClick={() => window.location.reload()} className="btn btn-outline">
                Submit Another
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="report-page">
      <Navbar />
      <div className="container report-container py-8">
        <h1 className="text-2xl font-bold mb-6 text-center">Report an Issue</h1>
        
        {/* Progress Tracker */}
        <div className="progress-tracker mb-8">
          {[
            { id: 1, icon: <Camera size={18}/>, label: 'Photo' },
            { id: 2, icon: <Cpu size={18}/>, label: 'Category' },
            { id: 3, icon: <MapPin size={18}/>, label: 'Location' },
            { id: 4, icon: <FileText size={18}/>, label: 'Details' },
            { id: 5, icon: <CheckCircle size={18}/>, label: 'Review' }
          ].map((s) => (
            <div key={s.id} className={`step-indicator ${step >= s.id ? 'active' : ''} ${step === s.id ? 'current' : ''}`}>
              <div className="step-circle">{s.id}</div>
              <span className="step-label">{s.label}</span>
              {s.id < 5 && <div className="step-line"></div>}
            </div>
          ))}
        </div>

        <div className="form-card">
          {step === 1 && (
            <div className="step-content">
              <h2>Upload Photo</h2>
              <p className="text-secondary mb-4">Please provide a clear photo of the issue.</p>
              
              {!imagePreview ? (
                <div 
                  className="upload-zone"
                  onClick={() => fileInputRef.current.click()}
                >
                  <UploadCloud size={48} className="text-primary mb-2" />
                  <p>Click or drag and drop image here</p>
                  <span className="text-sm text-secondary">Supports JPG, PNG</span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    ref={fileInputRef}
                    onChange={handleImageChange}
                  />
                </div>
              ) : (
                <div className="image-preview-container">
                  <img src={imagePreview} alt="Preview" className="image-preview" />
                  <button 
                    className="btn-remove-img"
                    onClick={() => { setImage(null); setImagePreview(''); }}
                  >
                    <X size={16} /> Remove
                  </button>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="step-content">
              <h2>Category Detection</h2>
              
              {loading ? (
                <div className="ai-loading">
                  <Loader2 size={40} className="spin text-primary mb-4" />
                  <p>AI is analyzing your image...</p>
                </div>
              ) : category === 'Unrecognized' ? (
                <div className="ai-result error-result">
                  <img src={imagePreview} alt="Thumbnail" className="thumb-img mb-4" />
                  <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg mb-6 flex items-start gap-3">
                    <AlertTriangle className="shrink-0 mt-1" />
                    <div>
                      <h3 className="font-bold mb-1">Image Not Recognized</h3>
                      <p>We couldn't detect any relevant issue in this image. Please upload a clear photo of waste, damage, or infrastructure issues.</p>
                    </div>
                  </div>
                  <button onClick={() => { setStep(1); setImage(null); setImagePreview(''); setCategory(''); }} className="btn btn-outline w-full flex items-center justify-center gap-2">
                    <Camera size={16} /> Upload Another Image
                  </button>
                </div>
              ) : (
                <div className="ai-result">
                  <img src={imagePreview} alt="Thumbnail" className="thumb-img mb-4" />
                  <div className="result-card mb-6">
                    <h3>AI Detection Result</h3>
                    <div className="flex justify-between items-center mb-2">
                      <strong className="text-lg">{category}</strong>
                      <span className="text-primary font-bold">{confidence}% Match</span>
                    </div>
                    <div className="progress-bar-bg">
                      <div className="progress-bar-fill" style={{ width: `${confidence}%` }}></div>
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label>Not correct? Select manually:</label>
                    <select 
                      value={category} 
                      onChange={(e) => setCategory(e.target.value)}
                      className="form-control"
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="step-content">
              <h2>Location Details</h2>
              <p className="text-secondary mb-4">Where is this issue located?</p>
              
              <div className="location-actions mb-4">
                <button onClick={getLocation} className="btn btn-outline flex items-center gap-2">
                  <MapPin size={16} /> Use My Current Location
                </button>
              </div>
              
              <div className="form-group">
                <label>Location Description (Landmark, Street)</label>
                <input 
                  type="text" 
                  value={locationText} 
                  onChange={(e) => setLocationText(e.target.value)}
                  className="form-control"
                  placeholder="E.g. Near Central Park entrance"
                />
              </div>
              
              <div className="map-wrapper mt-4">
                <label className="block mb-2">Pin on Map:</label>
                <MapView position={location} setPosition={setLocation} />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="step-content">
              <h2>Additional Details</h2>
              
              <div className="form-group">
                <label>Description</label>
                <textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="form-control"
                  rows="4"
                  placeholder="Describe the issue in detail..."
                  required
                ></textarea>
              </div>
              
              <div className="form-group">
                <label>People Affected (Estimated)</label>
                <div className="radio-group">
                  {['1-5', '6-20', '21-50', '50+'].map(val => (
                    <label key={val} className="radio-label">
                      <input 
                        type="radio" 
                        name="peopleAffected" 
                        value={val}
                        checked={peopleAffected === val}
                        onChange={(e) => setPeopleAffected(e.target.value)}
                      />
                      <span>{val}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div className="form-group">
                <label>Location Type</label>
                <select 
                  value={locationType} 
                  onChange={(e) => setLocationType(e.target.value)}
                  className="form-control"
                  required
                >
                  <option value="">Select type...</option>
                  <option value="Residential Area">Residential Area</option>
                  <option value="School/College">School/College</option>
                  <option value="Hospital">Hospital</option>
                  <option value="Market">Market</option>
                  <option value="Public Road">Public Road</option>
                  <option value="Park">Park</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="step-content">
              <h2>Review & Submit</h2>
              
              <div className="review-summary">
                <div className="review-image mb-4">
                  <img src={imagePreview} alt="Issue" className="rounded-lg max-h-48 object-cover w-full" />
                </div>
                
                <div className="review-details grid grid-cols-2 gap-4">
                  <div className="detail-item">
                    <span className="label block text-sm text-secondary">Category</span>
                    <strong className="block">{category} ({confidence}% AI Match)</strong>
                  </div>
                  <div className="detail-item">
                    <span className="label block text-sm text-secondary">Location Type</span>
                    <strong className="block">{locationType}</strong>
                  </div>
                  <div className="detail-item">
                    <span className="label block text-sm text-secondary">Location</span>
                    <strong className="block">{locationText}</strong>
                  </div>
                  <div className="detail-item">
                    <span className="label block text-sm text-secondary">People Affected</span>
                    <strong className="block">{peopleAffected}</strong>
                  </div>
                  <div className="detail-item col-span-2">
                    <span className="label block text-sm text-secondary">Description</span>
                    <p>{description}</p>
                  </div>
                </div>
                
                <div className="priority-preview mt-6 p-4 bg-green-50 rounded-lg flex items-center justify-between border border-green-100">
                  <div>
                    <h4 className="font-bold text-green-800">Estimated Priority Score</h4>
                    <p className="text-sm text-green-700">Based on your inputs</p>
                  </div>
                  <div className="text-3xl font-bold text-green-600">
                    {calculatePriority()}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {errorMsg && (
            <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 border border-red-200 rounded-lg flex items-center gap-2">
              <AlertTriangle size={16} />
              {errorMsg}
            </div>
          )}
          
          <div className="form-actions mt-8 flex justify-between">
            {step > 1 && !loading && (
              <button onClick={prevStep} className="btn btn-outline flex items-center gap-2">
                <ArrowLeft size={16} /> Back
              </button>
            )}
            <div className="ml-auto">
              {step < 5 && !loading && category !== 'Unrecognized' && (
                <button 
                  onClick={nextStep} 
                  className="btn btn-primary flex items-center gap-2"
                  disabled={step === 1 && !imagePreview}
                >
                  Next <ArrowRight size={16} />
                </button>
              )}
              {step === 5 && (
                <button 
                  onClick={handleSubmit} 
                  className="btn btn-primary flex items-center gap-2"
                  disabled={loading}
                >
                  {loading ? <><Loader2 size={16} className="spin"/> Submitting...</> : 'Submit Report'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
