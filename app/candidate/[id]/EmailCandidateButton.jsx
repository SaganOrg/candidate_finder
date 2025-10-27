'use client';

import { useState } from 'react';
import { Mail, X, Send, Loader2, Info } from 'lucide-react';

export default function EmailCandidateButton({ candidateEmail, candidateName, isLoggedIn = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [toEmail, setToEmail] = useState('');
  const [ccEmails, setCcEmails] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const fromEmail = 'hiring@email.saganrecruitment.com';

  // Don't render the button if user is not logged in
  if (!isLoggedIn) {
    return null;
  }

  const handleOpenModal = () => {
    setIsOpen(true);
    setSuccess(false);
    setError('');
    
    // Pre-fill TO email with candidate email
    setToEmail(candidateEmail);
    
    // Pre-fill subject
    setSubject(`Thank you for your interest in Sagan`);
    
    // Pre-fill with email template
    setMessage(`Hi ${candidateName},

Thank you for reaching out, and I appreciate your continued interest in opportunities with Sagan.

I understand how challenging the job search process can be, especially when you're consistently putting in the effort. Please know that many of the roles we support are highly competitive, with numerous qualified applicants. That said, your initiative in asking for feedback is a great sign of your commitment to growth.

While I can't provide detailed feedback on individual applications, I'd be happy to offer a few general tips that may help strengthen your chances:

• Tailor your resume for each role, highlighting experience that closely matches the job description.
• Use clear, results-driven language, quantifying your accomplishments where possible.
• Ensure alignment with the role's key requirements, such as availability in specific time zones, tool proficiency, and salary expectations.

I also encourage you to continue checking and applying through our careers page: https://www.careers-page.com/sagan#openings. We're constantly adding new roles, and your profile may be a better match for upcoming opportunities.

Thanks again for reaching out, and I wish you the very best in your job search.`);
  };

  const handleCloseModal = () => {
    setIsOpen(false);
    setSubject('');
    setMessage('');
    setToEmail('');
    setCcEmails('');
    setError('');
    setSuccess(false);
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  };

  const parseCcEmails = (ccString) => {
    if (!ccString.trim()) return [];
    
    return ccString
      .split(',')
      .map(email => email.trim())
      .filter(email => email.length > 0);
  };

  const handleSendEmail = async () => {
    // Validation
    if (!subject.trim()) {
      setError('Subject is required');
      return;
    }
    if (!message.trim()) {
      setError('Message is required');
      return;
    }
    if (!toEmail.trim()) {
      setError('TO email is required');
      return;
    }
    if (!validateEmail(toEmail)) {
      setError('Please enter a valid TO email address');
      return;
    }

    // Validate CC emails
    const ccEmailArray = parseCcEmails(ccEmails);
    for (const ccEmail of ccEmailArray) {
      if (!validateEmail(ccEmail)) {
        setError(`Invalid CC email address: ${ccEmail}`);
        return;
      }
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/send-candidate-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromEmail,
          to: toEmail.trim(),
          cc: ccEmails.trim(), // Send as comma-separated string
          subject: subject.trim(),
          message: message.trim(),
        }),
      });

      const responseText = await response.text();
      console.log('Raw response:', responseText);

      let result;
      try {
        result = responseText ? JSON.parse(responseText) : {};
      } catch (parseError) {
        console.error('Failed to parse response as JSON:', parseError);
        if (response.ok) {
          result = { success: true };
        } else {
          throw new Error('Invalid response from server');
        }
      }

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send email');
      }

      console.log('Email sent successfully:', result);
      setSuccess(true);
      
      setTimeout(() => {
        handleCloseModal();
      }, 2000);
    } catch (err) {
      console.error('Error sending email:', err);
      setError(err.message || 'Failed to send email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Email Button - Only visible to logged-in users */}
      <button
        onClick={handleOpenModal}
        className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm transition shadow-md"
        title="Send email to candidate (Admin only)"
      >
        <Mail size={20} />
        Send Email to Candidate
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          {/* Modal Content */}
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Send Email</h2>
                <p className="text-xs text-blue-600 mt-1">
                  ✓ Administrative access confirmed
                </p>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
                disabled={loading}
              >
                <X size={24} className="text-gray-600" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {/* Success Message */}
              {success && (
                <div className="bg-green-50 border-2 border-green-400 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">✅</span>
                    <div>
                      <p className="font-bold text-green-900">Email Sent Successfully!</p>
                      <p className="text-sm text-green-700">Your email has been sent to {toEmail}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border-2 border-red-400 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">❌</span>
                    <div>
                      <p className="font-bold text-red-900">Error</p>
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* FROM Field (Read-only) */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  From
                </label>
                <input
                  type="email"
                  value={fromEmail}
                  disabled
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                />
              </div>

              {/* TO Field (Editable) */}
              <div>
                <label htmlFor="toEmail" className="block text-sm font-semibold text-gray-700 mb-2">
                  To *
                </label>
                <input
                  id="toEmail"
                  type="email"
                  value={toEmail}
                  onChange={(e) => setToEmail(e.target.value)}
                  placeholder="Enter recipient email"
                  disabled={loading || success}
                  className="w-full px-4 py-3 border-2 text-black border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>

              {/* CC Field */}
              <div>
                <label htmlFor="ccEmails" className="block text-sm font-semibold text-gray-700 mb-2">
                  CC (Optional)
                </label>
                <input
                  id="ccEmails"
                  type="text"
                  value={ccEmails}
                  onChange={(e) => setCcEmails(e.target.value)}
                  placeholder="Enter CC emails separated by commas"
                  disabled={loading || success}
                  className="w-full px-4 py-3 border-2 text-black border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
                
                {/* CC Usage Instructions */}
                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Info size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">CC Email Rules:</p>
                      <ul className="text-xs space-y-1">
                        <li>• Separate multiple emails with commas</li>
                        <li>• Example: manager@company.com, hr@company.com, director@company.com</li>
                        <li>• Spaces around commas are automatically trimmed</li>
                        <li>• All emails will be validated before sending</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Show parsed CC emails preview */}
                {ccEmails.trim() && (
                  <div className="mt-2 p-2 bg-gray-50 border border-gray-200 rounded">
                    <p className="text-xs font-medium text-gray-700 mb-1">CC Recipients ({parseCcEmails(ccEmails).length}):</p>
                    <div className="flex flex-wrap gap-1">
                      {parseCcEmails(ccEmails).map((email, index) => (
                        <span 
                          key={index} 
                          className={`px-2 py-1 rounded text-xs ${
                            validateEmail(email) 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {email}
                          {!validateEmail(email) && ' ❌'}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Subject Field */}
              <div>
                <label htmlFor="subject" className="block text-sm font-semibold text-gray-700 mb-2">
                  Subject *
                </label>
                <input
                  id="subject"
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Enter email subject"
                  disabled={loading || success}
                  className="w-full px-4 py-3 border-2 text-black border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>

              {/* Message Field */}
              <div>
                <label htmlFor="message" className="block text-sm font-semibold text-gray-700 mb-2">
                  Message *
                </label>
                <textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Enter your message here..."
                  rows={12}
                  disabled={loading || success}
                  className="w-full px-4 py-3 border-2 text-black border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 resize-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Your message will be formatted as HTML before sending
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={handleCloseModal}
                disabled={loading}
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleSendEmail}
                disabled={loading || success}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send size={20} />
                    Send Email
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}