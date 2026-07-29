/**
 * UI Components — barrel export.
 *
 * Import from "@/components/ui" for all shared UI primitives.
 */

// ─── Form Inputs (text, textarea, file, color) ──────────────

export {
  FormInput,
  FormTextarea,
  FormFileInput,
  FormColorInput,
} from "./FormInput";

export type {
  FormInputProps,
  FormTextareaProps,
  FormFileInputProps,
  FormColorInputProps,
} from "./FormInput";

// ─── Select (native + searchable/taggable) ───────────────────

export {
  FormSelect,
  FormSearchSelect,
} from "./FormSelect";

export type {
  FormSelectProps,
  FormSearchSelectProps,
  SelectOption,
  SelectOptionGroup,
} from "./FormSelect";

// ─── Checkbox, Radio, Switch, Toggle ─────────────────────────

export {
  FormCheckbox,
  FormCheckboxGroup,
  FormRadio,
  FormRadioGroup,
  FormSwitch,
  FormToggleButton,
  FormToggleButtonGroup,
} from "./FormCheckRadio";

export type {
  FormCheckboxProps,
  FormCheckboxGroupProps,
  FormRadioProps,
  FormRadioGroupProps,
  FormSwitchProps,
  FormToggleButtonProps,
  FormToggleButtonGroupProps,
  CheckboxOption,
  RadioOption,
  ToggleOption,
  CheckSize,
  CheckColor,
} from "./FormCheckRadio";

// ─── Button ──────────────────────────────────────────────────

export {
  AppButton,
  ButtonGroup,
} from "./AppButton";

export type {
  AppButtonProps,
  ButtonGroupProps,
  ButtonColor,
  ButtonVariant,
  ButtonSize,
  ButtonRadius,
  ButtonShadow,
} from "./AppButton";

// ─── Badge ───────────────────────────────────────────────────

export {
  Badge,
  BadgeDot,
  BadgeOverlay,
} from "./Badge";

export type {
  BadgeProps,
  BadgeDotProps,
  BadgeOverlayProps,
  BadgeColor,
  BadgeVariant,
  BadgeSize,
  BadgeRadius,
  BadgePosition,
} from "./Badge";

// ─── Breadcrumb ──────────────────────────────────────────────

export {
  AppBreadcrumb,
  ChevronSeparator,
  DoubleChevronSeparator,
  ArrowSeparator,
  HomeIcon,
  FolderIcon,
  FileIcon,
} from "./AppBreadcrumb";

export type {
  AppBreadcrumbProps,
  BreadcrumbItem,
  BreadcrumbSeparator,
  BreadcrumbStyle,
  BreadcrumbSize,
} from "./AppBreadcrumb";

// ─── Dropdown ────────────────────────────────────────────────

export {
  Dropdown,
  DropdownItem,
  DropdownHeader,
  DropdownDivider,
  DropdownText,
  DropdownCustom,
} from "./Dropdown";

export type {
  DropdownProps,
  DropdownItemProps,
  DropdownHeaderProps,
  DropdownTextProps,
  DropdownCustomProps,
  DropdownPlacement,
} from "./Dropdown";

// ─── Popover ─────────────────────────────────────────────────

export { Popover } from "./Popover";

export type {
  PopoverProps,
  PopoverPlacement,
  PopoverTriggerMode,
  PopoverColor,
  PopoverVariant,
} from "./Popover";

// ─── Pagination ──────────────────────────────────────────────

export { Pagination } from "./Pagination";

export type {
  PaginationProps,
  PaginationSize,
  PaginationVariant,
  PaginationRadius,
  PaginationColor,
} from "./Pagination";

// ─── Toast ───────────────────────────────────────────────────

export { ToastProvider, useToast } from "./Toast";

export type {
  ToastProps,
  ToastColor,
  ToastVariant,
  ToastPlacement,
  ToastAction,
} from "./Toast";

// ─── Tooltip ─────────────────────────────────────────────────

export { Tooltip } from "./Tooltip";

export type {
  TooltipProps,
  TooltipPlacement,
  TooltipColor,
} from "./Tooltip";

// ─── Spinner ─────────────────────────────────────────────────

export { Spinner } from "./Spinner";

export type {
  SpinnerProps,
  SpinnerVariant,
  SpinnerColor,
  SpinnerSize,
} from "./Spinner";

// ─── Progress ────────────────────────────────────────────────

export { Progress } from "./Progress";

export type {
  ProgressProps,
  ProgressColor,
  ProgressSize,
} from "./Progress";

// ─── Modal ───────────────────────────────────────────────────

export {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "./Modal";

export type {
  ModalProps,
  ModalSize,
  ModalPlacement,
  ModalScrollBehavior,
} from "./Modal";
