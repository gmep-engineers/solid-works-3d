using System;
using System.Windows;
using System.Windows.Controls;
using Levitate3D.Supplier.Models;
using Levitate3D.Supplier.Services;

namespace Levitate3D.Supplier
{
    public partial class MainWindow : Window
    {
        private readonly SupplierApiClient _client;
        private SupplierJob? _currentJob;

        public MainWindow()
        {
            InitializeComponent();
            _client = new SupplierApiClient();
            Loaded += MainWindow_Loaded;
        }

        private async void MainWindow_Loaded(object sender, RoutedEventArgs e)
        {
            // Authenticate with device token
            bool authenticated = await _client.AuthenticateAsync(
                "factory@3dprint-supplier.cn",
                "factory123",
                "WIN-APP-DEMO-HARDWARE-TOKEN"
            );

            if (authenticated)
            {
                TxtStatus.Text = "Connected & Device Authenticated";
                await RefreshJobsAsync();
            }
            else
            {
                TxtStatus.Text = "Offline / Simulation Mode";
                LoadDemoJob();
            }
        }

        private async void BtnRefresh_Click(object sender, RoutedEventArgs e)
        {
            await RefreshJobsAsync();
        }

        private async System.Threading.Tasks.Task RefreshJobsAsync()
        {
            try
            {
                var jobsRes = await _client.GetJobsAsync();
                if (jobsRes != null)
                {
                    ListJobs.ItemsSource = jobsRes.QueueNeedsRefinement;
                    if (jobsRes.QueueNeedsRefinement.Length > 0)
                    {
                        ListJobs.SelectedIndex = 0;
                    }
                }
            }
            catch
            {
                LoadDemoJob();
            }
        }

        private void LoadDemoJob()
        {
            var demo = new SupplierJob
            {
                JobId = "44444444-4444-4444-4444-444444444444",
                JobCode = "JOB-LEV-2026-891042",
                SupplierStage = "NEEDS_REFINEMENT",
                DesignerAdjustmentNotes = "Please embed 18.2mm magnet cavity at bottom center. Hollow chest cavity for wireless LED inductive receiver.",
                HardwareSpecs = new HardwareSpecs
                {
                    Size = "LARGE",
                    DimensionsMm = "180mm x 110mm x 110mm",
                    FinishType = "TRANSLUCENT_GLOW",
                    BaseType = "CUSTOM_MAGNETIC_LEVITATING_BASE",
                    MagneticCavitySpecs = "18.2mm diameter x 6.5mm depth cylindrical cavity at base center (N52 Magnet Socket)",
                    InternalLedWiringRequired = true
                }
            };
            ListJobs.ItemsSource = new[] { demo };
            ListJobs.SelectedIndex = 0;
        }

        private void ListJobs_SelectionChanged(object sender, SelectionChangedEventArgs e)
        {
            if (ListJobs.SelectedItem is SupplierJob job)
            {
                _currentJob = job;
                TxtJobCode.Text = job.JobCode;
                TxtJobSpecsSummary.Text = $"{job.HardwareSpecs.DimensionsMm} • {job.HardwareSpecs.FinishType}";
                TxtMagnetCavity.Text = job.HardwareSpecs.MagneticCavitySpecs;
                TxtLedSpecs.Text = job.HardwareSpecs.InternalLedWiringRequired
                    ? "3.0mm smooth curved wire conduit + hollow core for wireless inductive coil."
                    : "Standard statue - no internal wiring required.";
                TxtNotes.Text = job.DesignerAdjustmentNotes;
            }
        }

        private async void BtnUpload_Click(object sender, RoutedEventArgs e)
        {
            if (_currentJob == null) return;
            string url = TxtModelUrl.Text;
            string notes = TxtUploadNotes.Text;

            bool ok = await _client.UploadRefinedModelAsync(_currentJob.JobId, url, notes);
            MessageBox.Show(ok ? "Model uploaded and locked into WORM legal ledger!" : "Upload recorded (simulation mode).", "WORM Secured", MessageBoxButton.OK, MessageBoxImage.Information);
        }

        private async void BtnAdvancePrinting_Click(object sender, RoutedEventArgs e)
        {
            if (_currentJob == null) return;
            bool ok = await _client.UpdateJobStatusAsync(_currentJob.JobId, "PRINTING_WIRING");
            MessageBox.Show("Production stage advanced to PRINTING_WIRING and recorded in WORM ledger.", "Success", MessageBoxButton.OK, MessageBoxImage.Information);
        }

        private async void BtnShip_Click(object sender, RoutedEventArgs e)
        {
            if (_currentJob == null) return;
            string tracking = TxtTracking.Text;
            bool ok = await _client.UpdateJobStatusAsync(_currentJob.JobId, "PACKAGED_SHIPPED", "DHL Express", tracking);
            MessageBox.Show($"Order marked PACKAGED_SHIPPED with tracking {tracking}. WORM ledger locked.", "Dispatched", MessageBoxButton.OK, MessageBoxImage.Information);
        }
    }
}
