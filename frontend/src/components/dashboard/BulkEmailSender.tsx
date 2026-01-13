import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Users, Send, Eye, X, Upload, Paperclip } from 'lucide-react';
import { apiGetEmailRecipients, apiSendBulkEmail } from '../../lib/api';
import { cn } from '../../lib/utils';

const BulkEmailSender = () => {
  const [subject, setSubject] = useState('');
  const [htmlContent, setHtmlContent] = useState('');
  const [sendToAll, setSendToAll] = useState(true);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [totalRecipients, setTotalRecipients] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadRecipients();
  }, []);

  const loadRecipients = async () => {
    try {
      const res = await apiGetEmailRecipients();
      setTotalRecipients(res.total || 0);
    } catch (error) {
      console.error('Failed to load recipients:', error);
    }
  };

  const handleSend = async () => {
    if (!subject.trim() || !htmlContent.trim()) {
      setMessage({ type: 'error', text: 'Subject and content are required' });
      return;
    }

    if (!sendToAll && !recipientEmail.trim()) {
      setMessage({ type: 'error', text: 'Recipient email is required' });
      return;
    }

    setSending(true);
    setMessage(null);

    try {
      const result = await apiSendBulkEmail({
        subject,
        html_content: htmlContent,
        send_to_all: sendToAll,
        recipient_email: sendToAll ? undefined : recipientEmail,
      });

      setMessage({
        type: 'success',
        text: `Email sent successfully to ${result.recipients_count} recipient(s)!`,
      });

      // Reset form
      setSubject('');
      setHtmlContent('');
      setRecipientEmail('');
      setShowPreview(false);
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error?.body?.detail || 'Failed to send email',
      });
    } finally {
      setSending(false);
    }
  };

  const generatePreview = () => {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        ${htmlContent}
      </div>
    `;
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-light tracking-widest mb-2">Send Bulk Email</h1>
        <p className="text-foreground">Compose and send emails to your customers</p>
      </div>

      {/* Message Alert */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={cn(
              'mb-6 p-4 rounded-lg flex items-center justify-between',
              message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
            )}
          >
            <span>{message.text}</span>
            <button onClick={() => setMessage(null)} className="text-current">
              <X size={18} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recipient Selection */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-jost uppercase tracking-widest mb-4 flex items-center gap-2">
              <Users size={20} className="text-heading" />
              Recipients
            </h3>

            <div className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  checked={sendToAll}
                  onChange={() => setSendToAll(true)}
                  className="w-4 h-4 text-heading"
                />
                <span className="text-foreground">
                  Send to all users <span className="text-heading font-medium">({totalRecipients} recipients)</span>
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  checked={!sendToAll}
                  onChange={() => setSendToAll(false)}
                  className="w-4 h-4 text-heading"
                />
                <span className="text-foreground">Send to specific email</span>
              </label>

              {!sendToAll && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <input
                    type="email"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder="Enter recipient email"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-heading"
                  />
                </motion.div>
              )}
            </div>
          </div>

          {/* Email Content */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-jost uppercase tracking-widest mb-4 flex items-center gap-2">
              <Mail size={20} className="text-heading" />
              Email Content
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Subject *</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Enter email subject"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-heading"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">HTML Content *</label>
                <textarea
                  value={htmlContent}
                  onChange={(e) => setHtmlContent(e.target.value)}
                  placeholder="Enter your HTML email content here..."
                  rows={12}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-heading font-mono text-sm"
                />
                <p className="mt-2 text-xs text-gray-500">
                  Tip: Use inline CSS for styling. Brand colors: #8D7B7C (heading), #F5EFEF (background)
                </p>
              </div>

              {/* Quick Templates */}
              <div className="pt-4 border-t">
                <p className="text-sm font-medium text-foreground mb-2">Quick Templates:</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setHtmlContent(`<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #8D7B7C;">Hello!</h2>
  <p>Your content here...</p>
  <p style="color: #626363;">Best regards,<br>The SP Aroma Team</p>
</div>`)}
                    className="px-3 py-1 text-xs bg-primary-bg text-heading rounded-full hover:bg-heading hover:text-white transition-colors"
                  >
                    Basic Template
                  </button>
                  <button
                    onClick={() => setHtmlContent(`<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background-color: #F5EFEF; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <h2 style="color: #8D7B7C; margin-top: 0;">Special Announcement</h2>
    <p>Your announcement here...</p>
  </div>
  <p style="color: #626363;">The SP Aroma Team</p>
</div>`)}
                    className="px-3 py-1 text-xs bg-primary-bg text-heading rounded-full hover:bg-heading hover:text-white transition-colors"
                  >
                    Announcement
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={() => setShowPreview(true)}
              disabled={!subject || !htmlContent}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-white border-2 border-heading text-heading rounded-full hover:bg-primary-bg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Eye size={20} />
              Preview Email
            </button>
            <button
              onClick={handleSend}
              disabled={sending || !subject || !htmlContent}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-heading text-white rounded-full hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={20} />
              {sending ? 'Sending...' : 'Send Email'}
            </button>
          </div>
        </div>

        {/* Info Section */}
        <div className="space-y-6">
          <div className="bg-primary-bg rounded-lg p-6">
            <h3 className="text-lg font-jost uppercase tracking-widest mb-4">Tips</h3>
            <ul className="space-y-2 text-sm text-foreground">
              <li>• Use clear and concise subject lines</li>
              <li>• Keep your content mobile-friendly</li>
              <li>• Test with single email before sending to all</li>
              <li>• Include unsubscribe option for compliance</li>
              <li>• Use inline CSS for better compatibility</li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-jost uppercase tracking-widest mb-4">Brand Colors</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg" style={{ backgroundColor: '#8D7B7C' }}></div>
                <div className="text-sm">
                  <p className="font-medium">#8D7B7C</p>
                  <p className="text-gray-500">Heading</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg border border-gray-200" style={{ backgroundColor: '#F5EFEF' }}></div>
                <div className="text-sm">
                  <p className="font-medium">#F5EFEF</p>
                  <p className="text-gray-500">Background</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg border border-gray-200" style={{ backgroundColor: '#626363' }}></div>
                <div className="text-sm">
                  <p className="font-medium">#626363</p>
                  <p className="text-gray-500">Text</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      <AnimatePresence>
        {showPreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowPreview(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden"
            >
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-light tracking-widest">Email Preview</h2>
                  <p className="text-sm text-foreground mt-1">Subject: {subject}</p>
                </div>
                <button
                  onClick={() => setShowPreview(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)] bg-gray-50">
                <div
                  className="bg-white rounded-lg shadow-sm p-4"
                  dangerouslySetInnerHTML={{ __html: generatePreview() }}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BulkEmailSender;
