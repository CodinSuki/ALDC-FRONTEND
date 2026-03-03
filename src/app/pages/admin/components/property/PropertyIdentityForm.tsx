type ProjectOption = {
  projectid: number;
  projectname: string;
};

type PropertyTypeOption = {
  propertytypeid: number;
  propertytypename: string;
};

type PropertyIdentityFormProps = {
  formData: any;
  projects: ProjectOption[];
  propertyTypes: PropertyTypeOption[];
  onChange: (field: string, value: any) => void;
};

export default function PropertyIdentityForm({
  formData,
  projects,
  propertyTypes,
  onChange,
}: PropertyIdentityFormProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm text-gray-700 mb-1">Property Name</label>
        <input
          type="text"
          value={formData.propertyname || ''}
          onChange={e => onChange('propertyname', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
        />
      </div>

      <div>
        <label className="block text-sm text-gray-700 mb-1">Project</label>
        <select
          value={formData.projectid || ''}
          onChange={e => onChange('projectid', Number(e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
        >
          <option value="">Select Project</option>
          {projects.map(project => (
            <option key={project.projectid} value={project.projectid}>
              {project.projectname}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm text-gray-700 mb-1">Property Type</label>
        <select
          value={formData.propertytypeid || ''}
          onChange={e =>
            onChange('propertytypeid', e.target.value ? Number(e.target.value) : null)
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
        >
          <option value="">Select Property Type</option>
          {propertyTypes.map(type => (
            <option key={type.propertytypeid} value={type.propertytypeid}>
              {type.propertytypename}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
