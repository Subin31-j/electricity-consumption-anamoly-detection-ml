import { Modal } from '../../components/ui/Modal';
import { Icon } from '../../components/ui/Icon';

export default function ConfirmDialog({ open, title, message, onConfirm, onCancel, confirmLabel = 'Confirm' }) {
  return (
    <Modal
      open={open}
      title={title}
      onClose={onCancel}
      className="confirm-modal"
      footer={
        <>
          <button className="btn-ghost" type="button" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn-danger" type="button" onClick={onConfirm}>
            <Icon name="trash" size={15} /> {confirmLabel}
          </button>
        </>
      }
    >
      <div className="confirm-body">
        <span className="confirm-icon" aria-hidden="true">
          <Icon name="alert" size={20} />
        </span>
        <p>{message}</p>
      </div>
    </Modal>
  );
}
