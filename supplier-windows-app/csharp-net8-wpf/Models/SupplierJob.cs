using System;
using System.Text.Json.Serialization;

namespace Levitate3D.Supplier.Models
{
    public class HardwareSpecs
    {
        [JsonPropertyName("size")]
        public string Size { get; set; } = string.Empty;

        [JsonPropertyName("dimensions_mm")]
        public string DimensionsMm { get; set; } = string.Empty;

        [JsonPropertyName("finish_type")]
        public string FinishType { get; set; } = string.Empty;

        [JsonPropertyName("base_type")]
        public string BaseType { get; set; } = string.Empty;

        [JsonPropertyName("magnetic_cavity_specs")]
        public string MagneticCavitySpecs { get; set; } = string.Empty;

        [JsonPropertyName("internal_led_wiring_required")]
        public bool InternalLedWiringRequired { get; set; }
    }

    public class DestinationSummary
    {
        [JsonPropertyName("country")]
        public string Country { get; set; } = string.Empty;

        [JsonPropertyName("city")]
        public string City { get; set; } = string.Empty;
    }

    public class SupplierJob
    {
        [JsonPropertyName("job_id")]
        public string JobId { get; set; } = string.Empty;

        [JsonPropertyName("job_code")]
        public string JobCode { get; set; } = string.Empty;

        [JsonPropertyName("supplier_stage")]
        public string SupplierStage { get; set; } = string.Empty;

        [JsonPropertyName("original_model_url")]
        public string OriginalModelUrl { get; set; } = string.Empty;

        [JsonPropertyName("designer_adjustment_notes")]
        public string DesignerAdjustmentNotes { get; set; } = string.Empty;

        [JsonPropertyName("hardware_specs")]
        public HardwareSpecs HardwareSpecs { get; set; } = new HardwareSpecs();

        [JsonPropertyName("destination_summary")]
        public DestinationSummary DestinationSummary { get; set; } = new DestinationSummary();
    }

    public class SupplierJobsResponse
    {
        [JsonPropertyName("total_active_jobs")]
        public int TotalActiveJobs { get; set; }

        [JsonPropertyName("queue_needs_refinement")]
        public SupplierJob[] QueueNeedsRefinement { get; set; } = Array.Empty<SupplierJob>();

        [JsonPropertyName("queue_print_and_assembly")]
        public SupplierJob[] QueuePrintAndAssembly { get; set; } = Array.Empty<SupplierJob>();
    }
}
