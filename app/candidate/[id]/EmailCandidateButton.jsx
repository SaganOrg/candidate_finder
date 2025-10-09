'use client';

import { useState } from 'react';
import { Mail, X, Send, Loader2 } from 'lucide-react';

export default function EmailCandidateButton({ candidateEmail, candidateName }) {
  const [isOpen, setIsOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleOpenModal = () => {
    setIsOpen(true);
    setSuccess(false);
    setError('');
    // Pre-fill subject with candidate name
    setSubject(`Opportunity for ${candidateName}`);
    setMessage('');
  };

  const handleCloseModal = () => {
    setIsOpen(false);
    setSubject('');
    setMessage('');
    setError('');
    setSuccess(false);
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

    setLoading(true);
    setError('');

    try {
      // Use your API route as proxy to avoid CORS issues
      const response = await fetch('/api/send-candidate-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: candidateEmail,
          subject: subject.trim(),
          message: message.trim(),
        }),
      });

      // Get response as text first
      const responseText = await response.text();
      console.log('Raw response:', responseText);

      // Try to parse as JSON
      let result;
      try {
        result = responseText ? JSON.parse(responseText) : {};
      } catch (parseError) {
        console.error('Failed to parse response as JSON:', parseError);
        // If parsing fails but status is OK, treat as success
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
      
      // Close modal after 2 seconds
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
      {/* Email Button */}
      <button
        onClick={handleOpenModal}
        className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm transition shadow-md"
      >
        <Mail size={20} />
        Send Email to Candidate
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          {/* Modal Content */}
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Send Email</h2>
                <p className="text-sm text-gray-600 mt-1">
                  To: <span className="font-semibold">{candidateEmail}</span>
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
                      <p className="text-sm text-green-700">Your email has been sent to {candidateName}</p>
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
                  rows={10}
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