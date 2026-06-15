import { useTranslation } from 'react-i18next';
import ChatBot from './ChatBot';

const labelColors = {
  Fresh: 'bg-green-100 text-green-800 border-green-300',
  Borderline: 'bg-amber-100 text-amber-800 border-amber-300',
  Spoiled: 'bg-red-100 text-red-800 border-red-300',
};

export default function ScanResult({ scan, onAddToInventory }) {
  const { t } = useTranslation();

  return (
    <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{t('result.foodType')}</p>
          <p className="text-xl font-semibold">{scan.foodType}</p>
        </div>
        <span className={`px-4 py-2 rounded-full border font-medium ${labelColors[scan.label]}`}>
          {t(`label.${scan.label}`)}
        </span>
      </div>

      <div>
        <div className="flex justify-between text-sm mb-1">
          <span>{t('result.confidence')}</span>
          <span>{scan.confidence}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-green-600 h-3 rounded-full transition-all"
            style={{ width: `${scan.confidence}%` }}
          />
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-2">{t('result.gasReadings')}</h3>
        <table className="w-full text-sm border">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-2 text-left">{t('result.nh3')}</th>
              <th className="p-2 text-left">{t('result.h2s')}</th>
              <th className="p-2 text-left">{t('result.ethylene')}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="p-2">{scan.gasReadings.nh3}</td>
              <td className="p-2">{scan.gasReadings.h2s}</td>
              <td className="p-2">{scan.gasReadings.ethylene}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <ChatBot scanId={scan._id} initialExplanation={scan.chatbotExplanation} />

      <button
        onClick={() => onAddToInventory(scan)}
        className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
      >
        {t('result.addToInventory')}
      </button>
    </div>
  );
}
