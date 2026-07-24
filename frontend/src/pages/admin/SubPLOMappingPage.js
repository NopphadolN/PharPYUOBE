import AdminMenu from '../../components/AdminMenu';
import MappingManager from '../../components/MappingManager';

export default function SubPLOMappingPage() {

  return (

    <div className="flex min-h-screen bg-gray-50">

      <AdminMenu />

      <div className="flex-1">

        <MappingManager

          title="SubPLO Mapping"

          itemApi="/admin/subplos"
          mappingApi="/subplo-mapping"

          itemKey="sub_plo_id"
          codeField="subplo_code"
          childField="children"

          addPayloadKey="sub_plo_id"
          removePayloadKey="sub_plo_id"

          targetPayloadKey="course_id"

          popupApi="/mapping/courses"
          popupIdField="id"
          popupLabelField="code_en"

          mappedLabelField="code_en"

          matrixRowField="course_id"
          matrixRowLabel="code_en"

          showMatrix={true}

        />

      </div>

    </div>

  );

}